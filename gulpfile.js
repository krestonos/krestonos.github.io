//Создаем папку в которой будет храниться работа gulp
let project_folder = require("path").basename(__dirname);
// Имя папки с исходниками
let source_folder = "#src";

let fs = require("fs");
//переменная в которой будет содержаться в свою очередь
//содержаться пути в файлам и папкам
let path = {
  // храняться пути вывода, куда gulp загружает обработанные файлы
  build: {
    html: project_folder + "/",
    css: project_folder + "/css/",
    js: project_folder + "/js/",
    img: project_folder + "/img/",
    fonts: project_folder + "/fonts/",
  },
  src: {
    html: [source_folder + "/*.html", "!" + source_folder + "/_*.html"],
    css: source_folder + "/scss/style.scss",
    js: source_folder + "/js/script.js",
    img: source_folder + "/img/**/*.{jpg,png,svg,gif,ico,webp}",
    fonts: source_folder + "/fonts/*.ttf",
  },
  watch: {
    html: source_folder + "/**/*.html",
    css: source_folder + "/scss/**/*.scss",
    js: source_folder + "/js/**/*.js",
    img: source_folder + "/img/**/*.{jpg,png,svg,gif,ico,webp}",
  },
  // создание пути папки обьекта. отвечает  за удаление обьекта папки. каждый раз когда будем запускать gulp
  clean: "./" + project_folder + "/",
};
// создаем переменные для установки плагинов:
let { src, dest } = require("gulp"),
  gulp = require("gulp"),
  // обновляет страницу
  browsersync = require("browser-sync").create(),
  // подключает файлы
  fileinclude = require("gulp-file-include"),
  // удаляеть папку с конечным результатом ( что скидываем )
  del = require("del"),
  // работаеть с препроцессором scss
  scss = require("gulp-sass"),
  // добавляет автопрефикс
  autoprefixer = require("gulp-autoprefixer"),
  // групперует медиа запросы
  group_media = require("gulp-group-css-media-queries"),
  // оптимизируеть css
  clean_css = require("gulp-clean-css"),
  rename = require("gulp-rename"),
  // оптимизирует JS
  uglify = require("gulp-uglify-es").default,
  // оптимизирует картинки
  imagemin = require("gulp-imagemin"),
  // конвертирует в webp изображение
  webp = require("gulp-webp"),
  // интегрирует webp в html
  webphtml = require("gulp-webp-html"),
  // интегрирует webp в css
  webpcss = require("gulp-webpcss"),
  svgSprite = require("gulp-svg-sprite"),
  //  конвертирует в шрифты
  ttf2woff = require("gulp-ttf2woff"),
  ttf2woff2 = require("gulp-ttf2woff2"),
  // конвертирует шрифт
  fonter = require("gulp-fonter");
// функция обновляющая нашу страницу в переменной browsersync (Название должно отличаться от переменной browsersync - browserSync )
function browserSync(params) {
  browsersync.init({
    server: {
      baseDir: "./" + project_folder + "/",
    },
    port: 3000,
    // отключение оповищения про  обновление страницы браузера
    notify: false,
  });
}

function html() {
  return src(path.src.html)
    .pipe(fileinclude())
    .pipe(webphtml())
    .pipe(dest(path.build.html))
    .pipe(browsersync.stream());
}

function css() {
  return src(path.src.css)
    .pipe(
      scss({
        outputStyle: "expanded",
      })
    )
    .pipe(group_media())
    .pipe(
      autoprefixer({
        overrideBrowserslist: ["last 5 versions"],
        cascade: true,
      })
    )
    .pipe(webpcss())
    .pipe(dest(path.build.css))
    .pipe(clean_css())
    .pipe(
      rename({
        extname: ".min.css",
      })
    )
    .pipe(dest(path.build.css))
    .pipe(browsersync.stream());
}

function js() {
  return src(path.src.js)
    .pipe(fileinclude())
    .pipe(dest(path.build.js))
    .pipe(uglify())
    .pipe(
      rename({
        extname: ".min.js",
      })
    )
    .pipe(dest(path.build.js))
    .pipe(browsersync.stream());
}

function images() {
  return src(path.src.img)
    .pipe(
      webp({
        quality: 70,
      })
    )
    .pipe(dest(path.build.img))
    .pipe(src(path.src.img))
    .pipe(
      imagemin({
        progressive: true,
        svgoPlugins: [{ removeViewBox: false }],
        interlaced: true,
        optimizationLevel: 3, // 0 to 7
      })
    )
    .pipe(dest(path.build.img))
    .pipe(browsersync.stream());
}

function fonts() {
  src(path.src.fonts).pipe(ttf2woff()).pipe(dest(path.build.fonts));
  return src(path.src.fonts).pipe(ttf2woff2()).pipe(dest(path.build.fonts));
}

gulp.task("otf2ttf", function () {
  return src([source_folder + "/fonts/*.otf"])
    .pipe(
      fonter({
        formats: ["ttf"],
      })
    )
    .pipe(dest(source_folder + "/fonts/"));
});

gulp.task("svgSprite", function () {
  return gulp
    .src([source_folder + "/iconsprite/*.svg"])
    .pipe(
      svgSprite({
        mode: {
          stack: {
            sprite: "../icons/icons.svg", //sprite file name
            example: true,
          },
        },
      })
    )
    .pipe(dest(path.build.img));
});

function fontsStyle(params) {
  let file_content = fs.readFileSync(source_folder + "/scss/fonts.scss");
  if (file_content == "") {
    fs.writeFile(source_folder + "/scss/fonts.scss", "", cb);
    return fs.readdir(path.build.fonts, function (err, items) {
      if (items) {
        let c_fontname;
        for (var i = 0; i < items.length; i++) {
          let fontname = items[i].split(".");
          fontname = fontname[0];
          if (c_fontname != fontname) {
            fs.appendFile(
              source_folder + "/scss/fonts.scss",
              '@include font("' +
                fontname +
                '", "' +
                fontname +
                '", "400", "normal");\r\n',
              cb
            );
          }
          c_fontname = fontname;
        }
      }
    });
  }
}

function cb() {}

function watchFiles(params) {
  gulp.watch([path.watch.html], html);
  gulp.watch([path.watch.css], css);
  gulp.watch([path.watch.js], js);
  gulp.watch([path.watch.img], images);
}

function clean(params) {
  return del(path.clean);
}

let build = gulp.series(
  clean,
  gulp.parallel(js, css, html, images, fonts),
  fontsStyle
);
// при запуске gulp выполняеться переменная по умолчанию, которая в свою очередб будет запускать ф-ию  (build, watchFiles, browserSync)
let watch = gulp.parallel(build, watchFiles, browserSync);

exports.fontsStyle = fontsStyle;
exports.fonts = fonts;
exports.images = images;
exports.js = js;
exports.css = css;
exports.html = html;
exports.build = build;
exports.watch = watch;
exports.default = watch;
