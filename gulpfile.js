const gulp = require('gulp');
const imagemin = require('gulp-imagemin');
const mozjpeg = require('imagemin-mozjpeg');
const rename = require('gulp-rename');
const path = require('path');
const fonter = require('gulp-fonter');
const ttf2woff = require('gulp-ttf2woff');
const ttf2woff2 = require('gulp-ttf2woff2');

// Пути
const DIST = 'dist';
const SRC_IMG = 'image/**/*.{jpg,jpeg,png}';
const DEST_IMG = DIST;
const SRC_FONT_OTF = 'font/**/*.otf';
const SRC_FONT_TTF = 'font/**/*.ttf';
const DEST_FONT = `${DIST}/font`;

// Задача очистки папки dist с динамическим импортом del
function clean() {
  return import('del').then(del => del.deleteAsync([`${DIST}/**`, `!${DIST}`]));
}

// Функция переименования изображений
function renameForStructure() {
  return rename(function (file) {
    const sourceFolder = file.dirname.split(path.sep)[0];
    const basename = file.basename;

    let firstWord = '';
    let rest = '';

    function splitAtDashBeforeDigit(name) {
      const regex = /^(.*?)-(\d.*)$/;
      const match = name.match(regex);
      if (match) {
        return [match[1], '-' + match[2]];
      }
      return [name, ''];
    }

    if (basename.includes('@')) {
      const atIndex = basename.indexOf('@');
      const beforeAt = basename.slice(0, atIndex);
      const afterAt = basename.slice(atIndex);

      [firstWord, rest] = splitAtDashBeforeDigit(beforeAt);
      rest += afterAt;
    } else {
      [firstWord, rest] = splitAtDashBeforeDigit(basename);
    }

    file.dirname = firstWord;
    file.basename = `${firstWord}-${sourceFolder}${rest}`;
    // расширение сохраняется без изменений
  });
}

// Оптимизация изображений
function optimizeImages() {
  return gulp.src(SRC_IMG, { nodir: true })
    .pipe(imagemin([
      mozjpeg({ quality: 70, progressive: true }),
      imagemin.optipng({ optimizationLevel: 3 })
    ]))
    .pipe(renameForStructure())
    .pipe(gulp.dest(DEST_IMG));
}

// Конвертация OTF → TTF
function otf2ttf() {
  return gulp.src(SRC_FONT_OTF)
    .pipe(fonter({ formats: ['ttf'] }))
    .pipe(gulp.dest('font/'));
}

// Конвертация TTF → WOFF
function ttf2woffTask() {
  return gulp.src(SRC_FONT_TTF, { encoding: false })
    .pipe(ttf2woff())
    .pipe(gulp.dest(DEST_FONT));
}

// Конвертация TTF → WOFF2
function ttf2woff2Task() {
  return gulp.src(SRC_FONT_TTF, { encoding: false })
    .pipe(ttf2woff2())
    .pipe(gulp.dest(DEST_FONT));
}

// Групповая задача для шрифтов
const fonts = gulp.series(
  otf2ttf,
  gulp.parallel(ttf2woffTask, ttf2woff2Task)
);

// Задача сборки с очисткой dist перед запуском
const build = gulp.series(
  clean,
  gulp.parallel(optimizeImages, fonts)
);

exports.clean = clean;
exports.optimizeImages = optimizeImages;
exports.otf2ttf = otf2ttf;
exports.ttf2woff = ttf2woffTask;
exports.ttf2woff2 = ttf2woff2Task;
exports.fonts = fonts;
exports.build = build;
exports.default = build;
