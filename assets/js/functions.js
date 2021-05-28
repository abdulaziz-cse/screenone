$(document).ready(function () {
    $("#menuBtn").on('click', function () {
        $('.navbar-container').addClass('active');
        $('.navbar-backdrop').addClass('active');
    });
    $("#closeNavbar").on('click', function () {
        $('.navbar-container').removeClass('active');
        $('.navbar-backdrop').removeClass('active');
    });

    if ($(window).scrollTop() > 0) {
        $('#navigationBar').addClass('active');
    } 
});

$(window).scroll(function () {
    if ($(window).scrollTop() > 0) {
        $('#navigationBar').addClass('active');
    } else {
        $('#navigationBar').removeClass('active');
    }
});
