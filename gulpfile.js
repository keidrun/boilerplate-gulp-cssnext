const gulp = require('gulp'),
  uglify = require('gulp-uglify'),
  browserSync = require('browser-sync').create(),
  concat = require('gulp-concat'),
  plumber = require('gulp-plumber'),
  sourcemaps = require('gulp-sourcemaps'),
  rename = require('gulp-rename'),
  del = require('del'),
  zip = require('gulp-zip'),
  sequence = require('run-sequence'),
  babel = require('gulp-babel'),
  imagemin = require('gulp-imagemin'),
  imageminPngquant = require('imagemin-pngquant'),
  imageminJpegRecompress = require('imagemin-jpeg-recompress');

const postcss = require('gulp-postcss');

const DIST_PATH = 'public/dist',
  IMAGES_PATH = 'public/images/**/*.{png,jpeg,jpg,svg,gif}',
  SCRIPTS_PATH = 'public/scripts/**/*.js',
  STYLES_PATH = 'public/styles/**/*.css',
  HTML_PATH = 'public/*.html',
  EXPORT_PATH = 'export',
  BROWSERS = ['last 2 versions', 'ie 8'];

gulp.task('clean', () => {
  return del.sync([DIST_PATH, EXPORT_PATH]);
});

gulp.task('images', () => {
  return gulp
    .src(IMAGES_PATH)
    .pipe(
      imagemin([
        imagemin.gifsicle(),
        imagemin.jpegtran(),
        imagemin.optipng(),
        imagemin.svgo(),
        imageminPngquant(),
        imageminJpegRecompress()
      ])
    )
    .pipe(gulp.dest(DIST_PATH + '/images'));
});

gulp.task('styles', () => {
  const plugins = [
    // NOTE: Choose your best combination.
    // 1. transpile
    // SASS like
    require('postcss-import'),
    require('postcss-simple-vars'),
    require('postcss-nested'),
    require('postcss-mixins'),
    // Optional
    require('postcss-url'),
    require('postcss-custom-properties'),
    require('postcss-custom-media'),
    require('postcss-apply'),
    require('postcss-color-rgba-fallback'),
    require('pixrem'),
    require('postcss-size'),
    require('postcss-selector-matches'),
    require('postcss-browser-reporter'),
    // 2. format
    require('stylefmt'),
    require('stylelint'),
    // 3. attache
    require('autoprefixer')({ browsers: BROWSERS }),
    require('postcss-normalize')({ browsers: BROWSERS, forceImport: true }),
    // 4. minify
    require('postcss-sorting'),
    require('cssnano'),
    // handle postcss errors
    require('postcss-reporter')({
      clearMessages: true,
      throwError: true
    })
  ];
  return gulp
    .src('public/styles/styles.css')
    .pipe(plumber())
    .pipe(sourcemaps.init())
    .pipe(postcss(plugins))
    .pipe(
      rename({
        suffix: '.min'
      })
    )
    .pipe(sourcemaps.write())
    .pipe(gulp.dest(DIST_PATH))
    .pipe(browserSync.stream());
});

gulp.task('scripts', () => {
  return gulp
    .src(SCRIPTS_PATH)
    .pipe(plumber())
    .pipe(sourcemaps.init())
    .pipe(
      babel({
        presets: ['es2015'],
        plugins: ['transform-es2015-modules-umd']
      })
    )
    .pipe(uglify())
    .pipe(concat('scripts.js'))
    .pipe(
      rename({
        suffix: '.min'
      })
    )
    .pipe(sourcemaps.write())
    .pipe(gulp.dest(DIST_PATH))
    .pipe(browserSync.stream());
});

gulp.task('html', () => {
  return gulp.src(HTML_PATH).pipe(gulp.dest(DIST_PATH));
});

gulp.task('build', () => {
  return sequence('clean', ['images', 'styles', 'scripts', 'html']);
});

gulp.task('export', () => {
  return gulp
    .src(DIST_PATH + '/**/*')
    .pipe(zip('website.zip'))
    .pipe(gulp.dest(EXPORT_PATH));
});

gulp.task('watch', ['build'], () => {
  browserSync.init({
    server: DIST_PATH,
    index: 'index.html'
  });
  gulp.watch(STYLES_PATH, ['styles']);
  gulp.watch(SCRIPTS_PATH, ['scripts']);
  gulp.watch(HTML_PATH, ['html']).on('change', browserSync.reload);
});

gulp.task('default', ['watch'], () => {});
