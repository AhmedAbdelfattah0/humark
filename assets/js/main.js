/* ===================================================================
    Author          : Modina Theme
    Version         : 1.0
* ================================================================= */

(function($) {
    "use strict";

    $(document).ready(function() {

        new WOW().init();

        // Scroll Up Start <<//
        $("#scrollUp").on("click", function() {
            setTimeout(function() {
                $("html, body").animate({
                    scrollTop: "-=1000000px"
                }, "slow");
            }, 1000);
        });

        /*
       Jquery Mobile Menu
       ============================*/
        $('#main-menu').meanmenu({
            meanMenuContainer: '.mobile-nav-menu',
            meanScreenWidth: "1199",
            meanExpand: ['<i class="fal fa-plus"></i>'],
        });

        /*
        Jquery Sidebar Toggle
        ============================*/
        $(".mobile-menu-toggle-btn").on("click", function(e) {
            e.preventDefault();
            $(".menu-sidebar-area").addClass("active");
            $(".body-overlay").addClass("active");
        });
        $(".menu-sidebar-close-btn").on("click", function(e) {
            e.preventDefault();
            $(".menu-sidebar-area").removeClass("active");
            $(".body-overlay").removeClass("active");
        });

        /*
        Jquery Body Overlay
        ============================*/
        $(".body-overlay").on("click", function(e) {
            e.preventDefault();
            $(".menu-sidebar-area").removeClass("active");
            $(".body-overlay").removeClass("active");
        });

        /*
        Stikey Js
        ============================*/
        const body = document.body;
        const html = document.documentElement;
        const height = Math.max(body.scrollHeight, body.offsetHeight, html.clientHeight, html.scrollHeight, html.offsetHeight);

        if (100 < $(window).scrollTop()) {
            $(".header-menu-area.sticky-header").addClass("sticky_menu");
        }

        if (height > 1400) {
            const nav = $(".header-menu-area.sticky-header");
            let scrolled = false;
            $(window).scroll(function() {
                if (100 < $(window).scrollTop() && !scrolled) {
                    nav
                        .addClass("sticky_menu animated fadeIn")
                        .animate({
                            "margin-top": "0px"
                        });
                    scrolled = true;
                }
                if (100 > $(window).scrollTop() && scrolled) {
                    nav.removeClass("sticky_menu animated fadeIn").css("margin-top", "0px");
                    scrolled = false;
                }
            });
        }

        // Sidebar Area Start <<//
        $(".share-btn").on("click", function() {
            var target = $(this).data("target");
            $("#" + target).toggle();
        });
        $("#openButton").on("click", function(e) {
            e.preventDefault();
            $("#targetElement").removeClass("side_bar_hidden");
        });
        $("#openButton2").on("click", function(e) {
            e.preventDefault();
            $("#targetElement").removeClass("side_bar_hidden");
        });
        $("#closeButton").on("click", function(e) {
            e.preventDefault();
            $("#targetElement").addClass("side_bar_hidden");
        });

        // Hero Slider Start <<//
        var sliderActive1 = ".hero-slider";
        var sliderInit1 = new Swiper(sliderActive1, {
            loop: true,
            slidesPerView: 1,
            effect: "fade",
            speed: 2000,
            autoplay: {
                delay: 5000,
                disableOnInteraction: false,
            },
            navigation: {
                nextEl: ".hero-arry-prev",
                prevEl: ".hero-arry-next",
            },

        });

        // content animation when active start here
        function animated_swiper(selector, init) {
            var animated = function animated() {
                $(selector + " [data-animation]").each(function() {
                    var anim = $(this).data("animation");
                    var delay = $(this).data("delay");
                    var duration = $(this).data("duration");
                    $(this)
                        .removeClass("anim" + anim)
                        .addClass(anim + " animated")
                        .css({
                            webkitAnimationDelay: delay,
                            animationDelay: delay,
                            webkitAnimationDuration: duration,
                            animationDuration: duration,
                        })
                        .one("animationend", function() {
                            $(this).removeClass(anim + " animated");
                        });
                });
            };
            animated();
            init.on("slideChange", function() {
                $(sliderActive1 + " [data-animation]").removeClass("animated");
            });
            init.on("slideChange", animated);
        }
        
        animated_swiper(sliderActive1, sliderInit1);

        // Video Popup Start <<//
        $(".img-popup").magnificPopup({
            type: "image",
            fixedContentPos: false,
            gallery: {
                enabled: true,
            },
        });
        $('.video-popup').magnificPopup({
            type: "iframe",
            mainClass: "mfp-fade",
            removalDelay: 160,
            preloader: false,
            fixedContentPos: false
        });

        // Counterup Start <<//
        $(".count").counterUp({
            delay: 20,
            time: 3000,
        });

        // Nice Select Start <<//
        $('select').niceSelect();

        // Data Background Start <<//
        $("[data-background").each(function() {
            $(this).css(
                "background-image",
                "url( " + $(this).attr("data-background") + "  )"
            );
        });

        // Service Swiper Slide Start <<//
        const serviceWrapper = new Swiper(".service-wrapper", {
            spaceBetween: 30,
            speed: 1000,
            loop: "true",
            speed: 1000,
            autoplay: {
                delay: 4000,
                disableOnInteraction: false,
            },
            pagination: {
                el: ".dot",
                clickable: true,
            },
            breakpoints: {
                992: {
                    slidesPerView: 2,
                },
                1199: {
                    slidesPerView: 3,
                },
            },
        });

        const bankServiceWrapper = new Swiper(".bank-service-wrapper", {
            spaceBetween: 30,
            speed: 1000,
            loop: "true",
            speed: 1000,
            autoplay: {
                delay: 4000,
                disableOnInteraction: false,
            },
            pagination: {
                el: ".dot",
                clickable: true,
            },
            breakpoints: {
                992: {
                    slidesPerView: 2,
                },
                1199: {
                    slidesPerView: 3,
                },
            },
        });
        // Service Swiper Slide End <<//

        // Project Swiper Slide Start <<//
        const projectWrapper = new Swiper(".project-wrapper", {
            spaceBetween: 30,
            speed: 1000,
            loop: "true",
            speed: 1000,
            autoplay: {
                delay: 4000,
                disableOnInteraction: false,
            },
            pagination: {
                el: ".dot",
                clickable: true,
            },
            breakpoints: {
                767: {
                    slidesPerView: 1,
                },
                991: {
                    slidesPerView: 2,
                },
            },
        });
        // Project Swiper Slide End <<//

        // Testimonial Swiper Slide Start <<//
        const testimonialSlide = new Swiper(".testimonial-slide", {
            spaceBetween: 30,
            speed: 1000,
            loop: "true",
            slidesPerView: 1,
            speed: 1000,
            autoplay: {
                delay: 4000,
                disableOnInteraction: false,
            },
            pagination: {
                el: ".dot",
                clickable: true,
            },
        });

        const testimonialSlide2 = new Swiper(".testimonial-slide-2", {
            spaceBetween: 30,
            speed: 1000,
            loop: "true",
            slidesPerView: 1,
            speed: 1000,
            autoplay: {
                delay: 4000,
                disableOnInteraction: false,
            },
            pagination: {
                el: ".dot",
                clickable: true,
            },
            breakpoints: {
                992: {
                    slidesPerView: 2,
                },
            },
        });

        const testimonialSlide3 = new Swiper(".testimonial-slide-3", {
            spaceBetween: 30,
            speed: 1000,
            loop: "true",
            slidesPerView: 1,
            speed: 1000,
            autoplay: {
                delay: 4000,
                disableOnInteraction: false,
            },
            pagination: {
                el: ".dot",
                clickable: true,
            },
            breakpoints: {
                992: {
                    slidesPerView: 2,
                },
                1299: {
                    slidesPerView: 3,
                },
            },
        });

        const testimonialSlide4 = new Swiper(".testimonial-slide-4", {
            spaceBetween: 30,
            speed: 1000,
            loop: "true",
            slidesPerView: 1,
            speed: 1000,
            autoplay: {
                delay: 2000,
                disableOnInteraction: false,
            },
            navigation: {
                nextEl: ".arry-prev",
                prevEl: ".arry-next",
            },
            breakpoints: {
                992: {
                    slidesPerView: 2,
                },
            },
        });

        // Brand Logo Swiper Slide Start <<//
        const brandSlider = new Swiper(".brand-slider", {
            spaceBetween: 30,
            speed: 1000,
            loop: "true",
            speed: 1000,
            autoplay: {
                delay: 4000,
                disableOnInteraction: false,
            },
            pagination: {
                el: ".dot",
                clickable: true,
            },
            breakpoints: {
                475: {
                    slidesPerView: 2,
                },
                767: {
                    slidesPerView: 3,
                },
                992: {
                    slidesPerView: 3,
                },
                1199: {
                    slidesPerView: 5,
                },
            },
        });

        const brandSlider2 = new Swiper(".brand-slider-2", {
            spaceBetween: 30,
            speed: 1000,
            loop: "true",
            speed: 1000,
            autoplay: {
                delay: 4000,
                disableOnInteraction: false,
            },
            pagination: {
                el: ".dot",
                clickable: true,
            },
            breakpoints: {
                475: {
                    slidesPerView: 2,
                },
                767: {
                    slidesPerView: 3,
                },
                992: {
                    slidesPerView: 3,
                },
                1199: {
                    slidesPerView: 6,
                },
            },
        });

        const solarBrandWrapper = new Swiper(".solar-brand-wrapper", {
            spaceBetween: 30,
            speed: 1000,
            loop: "true",
            speed: 1000,
            autoplay: {
                delay: 4000,
                disableOnInteraction: false,
            },
            pagination: {
                el: ".dot",
                clickable: true,
            },
            breakpoints: {
                475: {
                    slidesPerView: 2,
                },
                767: {
                    slidesPerView: 3,
                },
                992: {
                    slidesPerView: 3,
                },
                1199: {
                    slidesPerView: 5,
                },
            },
        });

        // Case Study Swiper Slide Start <<//
        const caseStudy = new Swiper(".case-study-wrapper", {
            spaceBetween: 30,
            speed: 1000,
            loop: "true",
            speed: 1000,
            autoplay: {
                delay: 4000,
                disableOnInteraction: false,
            },
            pagination: {
                el: ".dot",
                clickable: true,
            },
            breakpoints: {
                767: {
                    slidesPerView: 1,
                },
                991: {
                    slidesPerView: 2,
                },
                1199: {
                    slidesPerView: 2,
                },
                1499: {
                    slidesPerView: 3,
                }
            },
        });

        // circle-progress
        $(".circle-bar").loading();

        $(function() {
            // Get the form.
            var form = $("#contact-form");
            // Get the messages div.
            var formMessages = $(".form-message");
            // Set up an event listener for the contact form.
            $(form).submit(function(e) {
                // Stop the browser from submitting the form.
                e.preventDefault();
                // Serialize the form data.
                var formData = $(form).serialize();
                // Submit the form using AJAX.
                $.ajax({
                        type: "POST",
                        url: $(form).attr("action"),
                        data: formData,
                    })
                    .done(function(response) {
                        // Make sure that the formMessages div has the 'success' class.
                        $(formMessages).removeClass("error");
                        $(formMessages).addClass("success");
                        // Set the message text.
                        $(formMessages).text(response);
                        // Clear the form.
                        $("#form input, #form textarea").val("");
                    })
                    .fail(function(data) {
                        // Make sure that the formMessages div has the 'error' class.
                        $(formMessages).removeClass("success");
                        $(formMessages).addClass("error");
                        // Set the message text.
                        if (data.responseText !== "") {
                            $(formMessages).text(data.responseText);
                        } else {
                            $(formMessages).text(
                                "Oops! An error occured and your message could not be sent."
                            );
                        }
                    });
            });
        });

    }); // end document ready function

    // Progressbar Start
    $.fn.loading = function() {
        var DEFAULTS = {
            backgroundColor: '#b3cef6',
            progressColor: '#4b86db',
            percent: 75,
            duration: 2000
        };

        $(this).each(function() {
            var $target = $(this);

            var opts = {
                backgroundColor: $target.data('color') ? $target.data('color').split(',')[0] : DEFAULTS.backgroundColor,
                progressColor: $target.data('color') ? $target.data('color').split(',')[1] : DEFAULTS.progressColor,
                percent: $target.data('percent') ? $target.data('percent') : DEFAULTS.percent,
                duration: $target.data('duration') ? $target.data('duration') : DEFAULTS.duration
            };
            // console.log(opts);

            $target.append('<div class="background"></div><div class="rotate"></div><div class="left"></div><div class="right"></div><div class=""><span>' + opts.percent + '%</span></div>');

            $target.find('.background').css('background-color', opts.backgroundColor);
            $target.find('.left').css('background-color', opts.backgroundColor);
            $target.find('.rotate').css('background-color', opts.progressColor);
            $target.find('.right').css('background-color', opts.progressColor);

            var $rotate = $target.find('.rotate');
            setTimeout(function() {
                $rotate.css({
                    'transition': 'transform ' + opts.duration + 'ms linear',
                    'transform': 'rotate(' + opts.percent * 3.6 + 'deg)'
                });
            }, 1);

            if (opts.percent > 50) {
                var animationRight = 'toggle ' + (opts.duration / opts.percent * 50) + 'ms step-end';
                var animationLeft = 'toggle ' + (opts.duration / opts.percent * 50) + 'ms step-start';
                $target.find('.right').css({
                    animation: animationRight,
                    opacity: 1
                });
                $target.find('.left').css({
                    animation: animationLeft,
                    opacity: 0
                });
            }
        });
    }

    // preloader - active
    function loader() {
        $(window).on('load', function() {
            // Animate loader off screen
            $(".preloader").addClass('loaded');
            $(".preloader").delay(600).fadeOut();
        });
    }
    loader();
    
})(jQuery); // End jQuery