var gulp         = require('gulp'),
    stylus       = require('gulp-stylus'),
    autoprefixer = require('gulp-autoprefixer'),
    concat       = require('gulp-concat'),
    growl        = require('notify-send'),
    fs           = require('fs'),
    // cssBase64    = require('gulp-css-base64'),
    spritesmith  = require('gulp.spritesmith')
    watch        = require('gulp-watch'),
    svg2png      = require('gulp-svg2png');

function checkBlock (page, block, format) {
    var path = 'lightBEM/',
        baseBlock = path + 'blocks/' + block + '/',
        pageBlock = path + 'pages/' + page + '/' + block + '/';

    var pathes = [];

    if( fs.existsSync(baseBlock) || fs.existsSync(pageBlock)) {

        if ( fs.existsSync(baseBlock + block + '.' + format) ) {
            pathes.push(baseBlock + block + '.' + format);
        }
        if ( fs.existsSync(pageBlock + block + '.' + format) ) {
            pathes.push(pageBlock + block + '.' + format);
        }

    } else {
        growl.notify('lightBEM', 'Блок ' + block + ' не найден');
        console.log('Блок ' + block + ' не найден');
    }

    return pathes;
}

function checkLib (lib, format) {
    var path = 'lightBEM/',
        libBlock = path + 'libs/' + lib + '/';

    var pathes = [];

    if( fs.existsSync(libBlock)) {
        if ( fs.existsSync(libBlock + lib + '.' + format) ) {
            pathes.push(libBlock + lib + '.' + format);
        }
    } else {
        growl.notify('lightBEM', 'Библиотека ' + lib + ' не найдена');
        console.log('Библиотека ' + lib + ' не найдена');
    }

    return pathes;
}

gulp.task('build_css', function () {

    var builder = fs.readFileSync('lightBEM/builder.json');
    builder = JSON.parse(builder);

    var libs = [];

    // Подключаем библиотеки, если они есть
    builder.libs && builder.libs.map(function (lib) {
        libs = libs.concat( checkLib(lib, 'styl') )
    });

    // Собираем наши страницы
    for (page in builder.pages) {
        var blocks = [];
        _blocks = builder.pages[page];

        // Подключаем блоки для страниц
        _blocks.map(function (block) {
            blocks = blocks.concat( checkBlock(page, block, 'styl') );
        });

        // Обрабатываем наши страницы
        gulp.src(libs.concat(blocks))
            .pipe(concat(page + '.styl'))
            .pipe(stylus())
            // .pipe(cssBase64({
            //     baseDir: "images",
            //     // maxWeightResource: 100,
            //     extensionsAllowed: ['.gif', '.jpg', '.png', '.svg']
            // }))
            .pipe(autoprefixer("last 8 version", "> 1%", "ie 8", "ie 7"), {cascade:false})
            .pipe(gulp.dest('css/'));
    }
});

gulp.task('build_js', function () {

    var builder = fs.readFileSync('lightBEM/builder.json');
    builder = JSON.parse(builder);

    var libs = [];

    // Подключаем библиотеки, если они есть
    builder.libs && builder.libs.map(function (lib) {
        libs = libs.concat(checkLib(lib, 'js'));
    });

    // Собираем наши страницы
    for (page in builder.pages) {
        var blocks = [];
        _blocks = builder.pages[page];

        // Подключаем блоки для страниц
        _blocks.map(function (block) {
            blocks = blocks.concat(checkBlock(page, block, 'js'));
        });

        // Обрабатываем наши страницы
        gulp.src(blocks)
            .pipe(concat(page + '.js'))
            .pipe(gulp.dest('js/'));
    }

    // Чистим от повторов
    // var pathes = libs.concat(blocks), cleanPathes = [];
    // pathes.map(function (path) {
    //     if (cleanPathes.indexOf(path) === -1) {
    //         cleanPathes.push(path);
    //     }
    // });

    // Обрабатываем наши страницы
    // gulp.src(cleanPathes)
    //     .pipe(concat('engine.js'))
    //     .pipe(gulp.dest('js/'));
});

gulp.task('svg2png', function () {
    gulp.src('./lightBEM/images/svg4sprite/*.svg')
        .pipe(svg2png())
        .pipe(gulp.dest('./lightBEM/images/4sprite/'));
});

gulp.task('sprite', function () {
    var spriteData =
        gulp.src('./lightBEM/images/4sprite/*.*')
            .pipe(spritesmith({
                imgName: 'sprite.png',
                cssName: 'sprite.styl',
                cssFormat: 'stylus',
                algorithm: 'binary-tree',
                cssTemplate: './lightBEM/.configs/stylus.template.mustache',
                cssVarMap: function(sprite) {
                    sprite.name = 's-' + sprite.name
                }
            }));

    spriteData.img.pipe(gulp.dest('./images/'));
    spriteData.css.pipe(gulp.dest('./lightBEM/libs/sprite/'));
});

gulp.task('watch', function () {

    watch('lightBEM/**/**/*.styl', function () {
        gulp.start('build_css');
    });

    watch('lightBEM/**/**/*.js', function () {
        gulp.start('build_js');
    });

    watch('lightBEM/images/svg4sprite/*.svg', function () {
        gulp.start('svg2png');
    });

    watch('lightBEM/images/4sprite/*.*', function () {
        gulp.start('sprite');
    });

    watch('lightBEM/builder.json', function () {
        gulp.start('build_js');
        gulp.start('build_css');
    });
});

gulp.task('default', ['svg2png', 'sprite', 'build_css', 'build_js', 'watch']);
