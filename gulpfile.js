const gulp      = require('gulp');
const replace   = require('gulp-replace');
const header    = require('gulp-header');
const uglify    = require('gulp-uglify');
const pkg       = require('./package.json');

let note = ["/* <%=name%> v<%=version%> by <%= author %>,doc:<%= url %> */\n", pkg];

gulp.task("makejs", function () {
    let js = ['src/*.js'];

    return gulp.src(js)

        .pipe(replace(/\$\{[a-zA-Z]+\}/g, function (match) {
            match = match.substr(
                match.indexOf('{') + 1,
                match.indexOf('}') - 2
            );
            return pkg[match];
        }))

        .pipe(uglify())
        .pipe(header.apply(null, note))
        .pipe(gulp.dest('./dist/'));
});

gulp.task("copyRes", function () {
    let res = [
        'src/index.css',
        "src/index.html",
        'src/left.png',
        'src/right.png'
    ];

    return gulp.src(res).pipe(gulp.dest("./dist/"));
});

exports.default = gulp.series("makejs", "copyRes");
