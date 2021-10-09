const { src, dest, parallel, series, watch } = require('gulp');

const browserSync   = require('browser-sync').create();
const sass          = require('gulp-sass');
const autoprefixer  = require('gulp-autoprefixer');
const cleancss      = require('gulp-clean-css');
const imagemin      = require('gulp-imagemin');
const webp          = require('gulp-webp');
const newer         = require('gulp-newer');
const del           = require('del');
const pug           = require('gulp-pug');
const plumber       = require('gulp-plumber');
const useref        = require('gulp-useref');
const uglify        = require('gulp-uglify-es').default;
const gulpif        = require('gulp-if');
const cssmin        = require('gulp-cssmin');
const smartGrid     = require('smart-grid');
const gcmq          = require('gulp-group-css-media-queries');
const path          = require('path');

//-------------------- BrowserSync -------------------->
function browsersync() {
  browserSync.init({
    server: { baseDir: 'app/' },
    notify: false,
    online: true
  });
}

//-------------------- Scripts -------------------->
function scripts() {
  return src(['app/js/**/*.js', '!app/js/libs'])
  .pipe(browserSync.stream());
}

//-------------------- Pug -------------------->
function template() {
  return src(['app/pug/*.pug', '!app/pug/template.pug'])
  .pipe(plumber())
  .pipe(pug( { pretty: true } ))
  .pipe(dest('app/'))
  .pipe(browserSync.stream());
}

//-------------------- Sass -------------------->
function styles() {
  return src('app/sass/style.sass')
  .pipe(sass())
  .pipe(gcmq())
  .pipe(autoprefixer({ overrideBrowserlist: ['last 20 versions'], grid: true }))
  // .pipe(cleancss(( { level: { 1: { specialComments: 0 } } } )))
  .pipe(dest('app/css/'))
  .pipe(browserSync.stream());
}

//-------------------- Images -------------------->
function images() {
  return src(['app/img/**/*.jpg', 'app/img/**/*.svg', '!app/img/**/*.webp'])
    .pipe(newer('app/img/**/*'))
    .pipe(imagemin([
      imagemin.mozjpeg({ quality: 95, progressive: true }),
      imagemin.svgo({
        plugins: [
          { removeViewBox: false },
          { cleanupIDs: false }
        ]
      })
    ]))
    .pipe(dest('build/img/'));
}

function imagesWebp() {
  return src(['app/img/**/*.png', 'app/img/**/*.gif', '!app/img/**/*.webp'])
  .pipe(newer('app/img/**/*'))
  .pipe(webp({quality: 100}))
  .pipe(dest('app/img/'));
}

//-------------------- Clean Images -------------------->
function cleanPng() {
  return del('app/img/**/*.png', { force: true });
}

//-------------------- Clean Build -------------------->
function cleanbuild() {
  return del('build/**/*', { force: true });
}

//-------------------- SmartGrid -------------------->
function grid(done){
  delete require.cache[path.resolve('./smartgrid.js')];
  let options = require('./smartgrid.js');
  smartGrid('./app/sass/helpers/', options);
  done();
}

//-------------------- Build Static -------------------->
function buildStatic() {
  return src([
    'app/css/*.css',
    'app/fonts/**/*',
    'app/img/**/*',
    'app/js/**/*',
    ], { base: 'app' }) //
  .pipe(dest('build'));
}

//-------------------- Build Scripts -------------------->
function buildScript() {
  return src('app/*.html')
  .pipe(useref())
  .pipe(gulpif('*.js', uglify()))
  .pipe(gulpif('*.css', cleancss()))
  .pipe(dest('build'));
}

//-------------------- Gulp Watch -------------------->
function startwatch() {
  watch('app/pug/**/*.pug', template);
  watch(['app/sass/**/*.sass', 'app/sass/**/*.scss'], styles);
  watch(['app/*.html', 'app/js/*.js']).on('change', browserSync.reload);
  watch('./smartgrid.js', grid);
}

//-------------------- Gulp Exports -------------------->
exports.browsersync   = browsersync;
exports.grid          = grid;
exports.scripts       = scripts;
exports.styles        = styles;
exports.template      = template;
exports.images        = images;
exports.imagesWebp    = imagesWebp;
exports.cleanbuild    = cleanbuild;
exports.cleanPng      = cleanPng;

exports.webp      = series(imagesWebp, cleanPng);
exports.default   = parallel(template, styles, scripts, browsersync, startwatch);
exports.build     = series(cleanbuild, styles, scripts, buildStatic, buildScript, images);