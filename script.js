/**
 * ==========================================================================
 * OLEG & INNA — ROYAL WEDDING INTERACTIVE CORE ENGINE
 * ==========================================================================
 * Загальний обсяг: 900+ рядків чистого коду (Vanilla JS ES6+)
 * Призначення: Повна логіка конверта, скретч-карток, галереї людей та анімацій
 * ==========================================================================
 */

(function () {
    "use strict";

    console.log("[WeddingEngine] Запуск ядра весільного інтерактиву...");

    // ==========================================================================
    // 1. ГЛОБАЛЬНИЙ СТАН ТА НАЛАШТУВАННЯ (GLOBAL STATE SYSTEM)
    // ==========================================================================
    const SYSTEM_CONFIG = {
        weddingTimestamp: new Date("August 26, 2026 15:00:00").getTime(),
        scratchLineWidth: 30,
        scratchEraseThreshold: 45,
        parallaxIntensity: 0.22,
        ambientInterval: 4000,
        maxAmbientPetals: 35
    };

    const SYSTEM_STATE = {
        isAppUnlocked: false,
        activeSectionIndex: 0,
        audioPlayingState: false,
        scratchedBlocks: {
            day: false,
            month: false,
            year: false
        },
        loadedImagesCount: 0,
        totalGuestsPhotos: 0,
        lastKnownScrollY: 0,
        windowHeight: window.innerHeight,
        windowWidth: window.innerWidth
    };

    // Максимально точний кеш усіх елементів сторінки
    const UI = {
        body: document.body,
        documentElement: document.documentElement,
        envelopeScreen: document.getElementById("envelope-screen"),
        envelopeClickArea: document.getElementById("envelope-click-area"),
        envelopeLetter: document.querySelector(".env-letter"),
        envelopeFlap: document.querySelector(".env-flap"),
        envelopeSeal: document.querySelector(".wax-seal-wrapper"),
        mainContent: document.getElementById("main-content"),
        countdown: {
            days: document.getElementById("days"),
            hours: document.getElementById("hours"),
            minutes: document.getElementById("minutes"),
            seconds: document.getElementById("seconds")
        },
        scratch: {
            dayCanvas: document.getElementById("canvas-scratch-day"),
            monthCanvas: document.getElementById("canvas-scratch-month"),
            yearCanvas: document.getElementById("canvas-scratch-year")
        },
        timeline: {
            section: document.getElementById("timeline-section"),
            progressBar: document.getElementById("timeline-progress"),
            nodes: document.querySelectorAll(".timeline-node-item")
        },
        parallax: {
            river: document.getElementById("parallax-river-img"),
            archFrame: document.querySelector(".wedding-arch-frame")
        },
        rsvp: {
            form: document.getElementById("rsvp-form"),
            nameField: document.getElementById("guest-name"),
            submitButton: document.querySelector(".premium-submit-button")
        },
        sections: document.querySelectorAll("section"),
        petalsContainer: document.getElementById("petals-container")
    };

    // ==========================================================================
    // 2. ДОПОМІЖНІ СИСТЕМНІ ФУНКЦІЇ (UTILITY UTILS)
    // ==========================================================================
    function logDiagnostics(moduleName, message, data = "") {
        console.log(`%c[${moduleName}] ${message}`, "color: #798262; font-weight: bold;", data);
    }

    function addSafeEvent(element, eventType, callbackFunction) {
        if (element) {
            element.addEventListener(eventType, callbackFunction);
        } else {
            console.warn(`[Engine Warning] Елемент для події '${eventType}' не знайдено в DOM.`);
        }
    }

    function formatTimeDigit(number) {
        return String(number).padStart(2, "0");
    }

    // ==========================================================================
    // 3. СИСТЕМА ВХОДУ ТА ВІДКРИТТЯ КОНВЕРТА (ENVELOPE DECRYPTION MODULE)
    // ==========================================================================
    function setupEnvelopeInteraction() {
        logDiagnostics("Envelope", "Підготовка тригерів кліку.");

        if (!UI.envelopeClickArea) {
            logDiagnostics("Envelope", "Критична помилка: область кліку не знайдена. Форсуємо розблокування сайту.");
            bypassEnvelopeDirectly();
            return;
        }

        addSafeEvent(UI.envelopeClickArea, "click", function () {
            if (SYSTEM_STATE.isAppUnlocked) return;
            SYSTEM_STATE.isAppUnlocked = true;

            logDiagnostics("Envelope", "Запуск ланцюжка анімацій розкриття...");

            // Етап 1: Руйнування та зникнення сургучу
            if (UI.envelopeScreen) UI.envelopeScreen.classList.add("open-step-1");
            
            // Етап 2: Розворот верхнього трикутника конверта назад
            setTimeout(function () {
                if (UI.envelopeScreen) UI.envelopeScreen.classList.add("open-step-2");
                logDiagnostics("Envelope", "Етап 2 виконано: Клапан розгорнуто.");
            }, 600);

            // Етап 3: Випливання внутрішнього листа з іменами вгору
            setTimeout(function () {
                if (UI.envelopeScreen) UI.envelopeScreen.classList.add("open-step-3");
                logDiagnostics("Envelope", "Етап 3 виконано: Запрошення висунуто.");
            }, 1300);

            // Етап 4: Повний зсув екрану конверта вгору, зняття блокування скролу body
            setTimeout(function () {
                if (UI.envelopeScreen) {
                    UI.envelopeScreen.classList.add("open-step-4");
                    UI.envelopeScreen.style.display = "none"; // Повне усунення з рендеру
                }

                // ВИПРАВЛЕННЯ: Видаляємо клас блокування, який був прописаний в HTML
                if (UI.body) {
                    UI.body.classList.remove("lock-scroll");
                    UI.body.style.overflow = "visible";
                    UI.body.style.position = "relative";
                    UI.body.style.height = "auto";
                }

                // Показуємо головний вміст, якщо він був прихований
                if (UI.mainContent) {
                    UI.mainContent.classList.remove("hidden");
                    UI.mainContent.style.opacity = "1";
                    UI.mainContent.style.display = "block";
                }

                logDiagnostics("Envelope", "Етап 4 виконано: Конверт ліквідовано, сайт розблоковано.");
                
                // Екстрена ініціалізація залежних підсистем
                reinitializeScratchCanvases();
                activateCinematicFocus();
                startAmbientPetalGenerator();
            }, 2300);
        });
    }

    function bypassEnvelopeDirectly() {
        if (UI.body) UI.body.classList.remove("lock-scroll");
        if (UI.mainContent) UI.mainContent.classList.remove("hidden");
        reinitializeScratchCanvases();
        activateCinematicFocus();
    }

    // ==========================================================================
    // 4. ПРЕМІАЛЬНИЙ ЛАЙВ-ТАЙМЕР (HIGH-ACCURACY WEDDING COUNTDOWN CLOCK)
    // ==========================================================================
    function startWeddingCountdownClock() {
        logDiagnostics("Chronometer", "Запуск розрахунку часу.");

        function updateClockTicks() {
            const currentTimestamp = new Date().getTime();
            const timeRemaining = SYSTEM_CONFIG.weddingTimestamp - currentTimestamp;

            if (timeRemaining <= 0) {
                renderFinishedClockState();
                clearInterval(clockIntervalId);
                return;
            }

            const days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
            const hours = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);

            applyTimeDataToDOM(days, hours, minutes, seconds);
        }

        function applyTimeDataToDOM(d, h, m, s) {
            if (UI.countdown.days) UI.countdown.days.innerText = formatTimeDigit(d);
            if (UI.countdown.hours) UI.countdown.hours.innerText = formatTimeDigit(h);
            if (UI.countdown.minutes) UI.countdown.minutes.innerText = formatTimeDigit(m);
            if (UI.countdown.seconds) UI.countdown.seconds.innerText = formatTimeDigit(s);
        }

        function renderFinishedClockState() {
            applyTimeDataToDOM(0, 0, 0, 0);
            logDiagnostics("Chronometer", "Весілля розпочалося!");
        }

        updateClockTicks();
        const clockIntervalId = setInterval(updateClockTicks, 1000);
    }

    // ==========================================================================
    // 5. МОДУЛЬ СКРЕТЧ-КАРТОК ДАТИ (MULTI-CANVAS INTERACTIVE ERASE ENGINE)
    // ==========================================================================
    const ScratchEngineCore = {
        registry: {},

        createModule: function (canvasElement, moduleIdentity) {
            if (!canvasElement) return;

            const context = canvasElement.getContext("2d", { willReadFrequently: true });
            let drawingState = false;

            const triggerResizeAndRepaint = () => {
                canvasElement.width = canvasElement.clientWidth;
                canvasElement.height = canvasElement.clientHeight;
                this.drawCoverLayer(canvasElement, context);
            };

            triggerResizeAndRepaint();
            window.addEventListener("resize", triggerResizeAndRepaint);

            const captureCoordinates = (event) => {
                const boundRect = canvasElement.getBoundingClientRect();
                const pointer = event.touches ? event.touches[0] : event;
                return {
                    x: pointer.clientX - boundRect.left,
                    y: pointer.clientY - boundRect.top
                };
            };

            const performEraseStroke = (x, y) => {
                context.globalCompositeOperation = "destination-out";
                context.lineWidth = SYSTEM_CONFIG.scratchLineWidth;
                context.lineCap = "round";
                context.lineJoin = "round";
                context.lineTo(x, y);
                context.stroke();
                context.beginPath();
                context.moveTo(x, y);
            };

            // Зв'язування подій миші
            addSafeEvent(canvasElement, "mousedown", (e) => {
                if (SYSTEM_STATE.scratchedBlocks[moduleIdentity]) return;
                drawingState = true;
                const coords = captureCoordinates(e);
                context.beginPath();
                context.moveTo(coords.x, coords.y);
            });

            addSafeEvent(canvasElement, "mousemove", (e) => {
                if (!drawingState || SYSTEM_STATE.scratchedBlocks[moduleIdentity]) return;
                e.preventDefault();
                const coords = captureCoordinates(e);
                performEraseStroke(coords.x, coords.y);
            });

            // Зв'язування подій сенсора (мобільні)
            addSafeEvent(canvasElement, "touchstart", (e) => {
                if (SYSTEM_STATE.scratchedBlocks[moduleIdentity]) return;
                drawingState = true;
                const coords = captureCoordinates(e);
                context.beginPath();
                context.moveTo(coords.x, coords.y);
            });

            addSafeEvent(canvasElement, "touchmove", (e) => {
                if (!drawingState || SYSTEM_STATE.scratchedBlocks[moduleIdentity]) return;
                e.preventDefault();
                const coords = captureCoordinates(e);
                performEraseStroke(coords.x, coords.y);
            });

            const endDrawing = () => {
                if (!drawingState) return;
                drawingState = false;
                this.calculateTransparency(canvasElement, context, moduleIdentity);
            };

            window.addEventListener("mouseup", endDrawing);
            window.addEventListener("touchend", endDrawing);

            this.registry[moduleIdentity] = { canvasElement, triggerResizeAndRepaint };
        },

        drawCoverLayer: function (canvas, ctx) {
            ctx.fillStyle = "#ebd19b";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
            gradient.addColorStop(0, "rgba(255, 255, 255, 0.3)");
            gradient.addColorStop(0.5, "rgba(197, 159, 82, 0.4)");
            gradient.addColorStop(1, "rgba(0, 0, 0, 0.15)");
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.font = "300 11px Montserrat";
            ctx.fillStyle = "#4e573c";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.letterSpacing = "2px";
            ctx.fillText("ЗІТРІТЬ", canvas.width / 2, canvas.height / 2);
        },

        calculateTransparency: function (canvas, ctx, moduleIdentity) {
            if (SYSTEM_STATE.scratchedBlocks[moduleIdentity]) return;

            const imageBuffer = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const dataPixels = imageBuffer.data;
            let opaqueCounter = 0;

            for (let i = 3; i < dataPixels.length; i += 4) {
                if (dataPixels[i] === 0) {
                    opaqueCounter++;
                }
            }

            const total = canvas.width * canvas.height;
            const percentageCleared = (opaqueCounter / total) * 100;

            if (percentageCleared >= SYSTEM_CONFIG.scratchEraseThreshold) {
                SYSTEM_STATE.scratchedBlocks[moduleIdentity] = true;
                this.animateOutCanvas(canvas);
            }
        },

        animateOutCanvas: function (canvas) {
            canvas.style.transition = "opacity 0.6s ease, transform 0.6s ease";
            canvas.style.opacity = "0";
            canvas.style.transform = "scale(0.85)";
            setTimeout(() => {
                canvas.style.display = "none";
            }, 600);
        }
    };

    function runScratchInitialization() {
        ScratchEngineCore.createModule(UI.scratch.dayCanvas, "day");
        ScratchEngineCore.createModule(UI.scratch.monthCanvas, "month");
        ScratchEngineCore.createModule(UI.scratch.yearCanvas, "year");
    }

    function reinitializeScratchCanvases() {
        Object.keys(ScratchEngineCore.registry).forEach((id) => {
            if (ScratchEngineCore.registry[id] && !SYSTEM_STATE.scratchedBlocks[id]) {
                ScratchEngineCore.registry[id].triggerResizeAndRepaint();
            }
        });
    }

    // ==========================================================================
    // 6. ІНТЕГРАЦІЯ ТА АНІМАЦІЯ ФОТОГРАФІЙ ЛЮДЕЙ (GUESTS GALLERY MANAGER)
    // ==========================================================================
    function setupGuestsGalleryManager() {
        logDiagnostics("Gallery", "Аналіз наявності блоку фотографій людей.");

        const items = document.querySelectorAll(".guest-photo-card");
        SYSTEM_STATE.totalGuestsPhotos = items.length;

        items.forEach((card, index) => {
            const image = card.querySelector(".guest-img-element");
            if (image) {
                image.addEventListener("load", () => {
                    SYSTEM_STATE.loadedImagesCount++;
                    logDiagnostics("Gallery", `Фотографію №${index + 1} успішно підвантажено.`);
                });
                
                // Безпечний фолбек для вже закешованих фото
                if (image.complete) {
                    image.dispatchEvent(new Event("load"));
                }
            }
        });
        
        createLightboxDOMStructure();
    }

    function createLightboxDOMStructure() {
        const overlay = document.createElement("div");
        overlay.id = "premium-lightbox-view";
        overlay.style.cssText = `
            position: fixed; top:0; left:0; width:100vw; height:100vh;
            background: rgba(43,35,31,0.92); backdrop-filter: blur(10px);
            z-index: 1000000; display: flex; flex-direction: column;
            justify-content: center; align-items: center; opacity:0;
            pointer-events: none; transition: opacity 0.4s ease;
        `;

        const wrapper = document.createElement("div");
        wrapper.style.cssText = "position: relative; max-width: 85%; max-height: 75%;";

        const img = document.createElement("img");
        img.id = "lightbox-target-img";
        img.style.cssText = "max-width:100%; max-height:100%; border-radius:8px; box-shadow: 0 20px 50px rgba(0,0,0,0.5);";

        const text = document.createElement("p");
        text.style.cssText = "color: #ffffff; margin-top:15px; font-family: Montserrat; font-size:0.9rem; letter-spacing:1px;";

        const closeBtn = document.createElement("div");
        closeBtn.innerHTML = "✕";
        closeBtn.style.cssText = "position:absolute; top:-40px; right:0; color:white; font-size:1.8rem; cursor:pointer;";

        wrapper.appendChild(img);
        wrapper.appendChild(closeBtn);
        overlay.appendChild(wrapper);
        overlay.appendChild(text);
        UI.body.appendChild(overlay);

        // Навішуємо події перегляду на всі картки людей
        document.querySelectorAll(".guest-photo-card").forEach(card => {
            card.addEventListener("click", () => {
                const targetSrc = card.querySelector(".guest-img-element")?.src;
                const targetName = card.querySelector(".guest-fullname-text")?.innerText;
                if (targetSrc) {
                    img.src = targetSrc;
                    text.innerText = targetName || "";
                    overlay.style.opacity = "1";
                    overlay.style.pointerEvents = "auto";
                }
            });
        });

        closeBtn.addEventListener("click", () => {
            overlay.style.opacity = "0";
            overlay.style.pointerEvents = "none";
        });
        overlay.addEventListener("click", (e) => {
            if(e.target === overlay) {
                overlay.style.opacity = "0";
                overlay.style.pointerEvents = "none";
            }
        });
    }

    // ==========================================================================
    // 7. СИСТЕМА КІНОФОКУСУ ТА СКРОЛУ (CINEMATIC FOCUS ENGINE)
    // ==========================================================================
    function activateCinematicFocus() {
        if (!("IntersectionObserver" in window)) {
            // Фолбек для застарілих браузерів
            UI.sections.forEach(s => s.classList.add("slide-focus-active"));
            return;
        }

        const observerSettings = {
            root: null,
            rootMargin: "-20% 0px -20% 0px",
            threshold: 0.1
        };

        const focusObserver = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add("slide-focus-active");
                } else {
                    entry.target.classList.remove("slide-focus-active");
                }
            });
        }, observerSettings);

        UI.sections.forEach(function (currentSection) {
            focusObserver.observe(currentSection);
        });
    }

    function processTimelineProgressScroll() {
        if (!UI.timeline.section || !UI.timeline.progressBar) return;

        const bounds = UI.timeline.section.getBoundingClientRect();
        const vh = SYSTEM_STATE.windowHeight;

        if (bounds.top < vh && bounds.bottom > 0) {
            const pathScrolled = vh - bounds.top - 120;
            const verticalTrackLimit = bounds.height - 160;
            
            let percentComputed = (pathScrolled / verticalTrackLimit) * 100;
            percentComputed = Math.max(0, Math.min(100, percentComputed));

            UI.timeline.progressBar.style.height = `${percentComputed}%`;

            UI.timeline.nodes.forEach(function (node) {
                if (node.getBoundingClientRect().top < vh * 0.72) {
                    node.classList.add("node-active");
                } else {
                    node.classList.remove("node-active");
                }
            });
        }
    }

    function applyVisualParallaxTransformations() {
        if (!UI.parallax.river) return;

        const riverBounds = UI.parallax.river.parentElement.getBoundingClientRect();
        const vh = SYSTEM_STATE.windowHeight;

        if (riverBounds.top < vh && riverBounds.bottom > 0) {
            const shiftMetric = (vh / 2) - (riverBounds.top + riverBounds.height / 2);
            const parallaxOffset = shiftMetric * SYSTEM_CONFIG.parallaxIntensity;
            
            UI.parallax.river.style.transform = `translate3d(0, ${parallaxOffset}px, 0) scale(1.1)`;
        }
    }

    // ==========================================================================
    // 8. ГЕНЕРАТОР ШОЛКОВИХ ПЕЛЮСТОК (DYNAMIC AMBIENT PARTICLES CANVAS ENGINE)
    // ==========================================================================
    function startAmbientPetalGenerator() {
        if (!UI.petalsContainer) return;

        function produceSinglePetal() {
            const activePetals = UI.petalsContainer.querySelectorAll(".petal");
            if (activePetals.length >= SYSTEM_CONFIG.maxAmbientPetals) return;

            const petal = document.createElement("div");
            petal.classList.add("petal");

            const randomizedDimension = Math.random() * 11 + 7;
            petal.style.width = `${randomizedDimension}px`;
            petal.style.height = `${randomizedDimension}px`;
            petal.style.left = `${Math.random() * 100}vw`;
            
            petal.style.animationDuration = `${Math.random() * 10 + 7}s`;
            petal.style.animationDelay = "0s";
            
            const colorPalettes = [
                "linear-gradient(135deg, #fbe9e7, #ffccbc)",
                "linear-gradient(135deg, #fff3e0, #ffe0b2)",
                "linear-gradient(135deg, #fce4ec, #f8bbd0)"
            ];
            petal.style.background = colorPalettes[Math.floor(Math.random() * colorPalettes.length)];

            UI.petalsContainer.appendChild(petal);

            setTimeout(() => {
                petal.remove();
            }, 15000);
        }

        setInterval(produceSinglePetal, 450);
    }

    // ==========================================================================
    // 9. АНКЕТА RSVP ТА ВАЛІДАЦІЯ (RSVP FORM TRANSLATION & MAILTO EXECUTOR)
    // ==========================================================================
    function runRsvpFormSubsystem() {
        if (!UI.rsvp.form) return;

        addSafeEvent(UI.rsvp.form, "submit", function (e) {
            e.preventDefault();

            const guestNameValue = UI.rsvp.nameField ? UI.rsvp.nameField.value.trim() : "";
            const recipientMail = "Viktorialopatovska606@gmail.com";

            if (!guestNameValue) {
                if (UI.rsvp.nameField) UI.rsvp.nameField.style.borderColor = "#ff4d4d";
                alert("Будь ласка, вкажіть ваше ім'я.");
                return;
            }

            if (UI.rsvp.submitButton) {
                UI.rsvp.submitButton.disabled = true;
                UI.rsvp.submitButton.innerText = "ОБРОБКА...";
            }

            const mailSubject = encodeURIComponent("Відповідь на весільне запрошення 💍");
            const mailBody = encodeURIComponent(`Привіт! Я підтверджую свою присутність на весіллі Олега та Інни.\nМоє ім'я: ${guestNameValue}`);

            setTimeout(() => {
                window.location.href = `mailto:${recipientMail}?subject=${mailSubject}&body=${mailBody}`;
                
                if (UI.rsvp.submitButton) {
                    UI.rsvp.submitButton.disabled = false;
                    UI.rsvp.submitButton.innerText = "ВІДПРАВЛЕНО";
                }
            }, 600);
        });
    }

    // ==========================================================================
    // 10. ОПТИМІЗАЦІЯ ХОДУ СКРОЛУ ТА ПЕРЕЗАПУСК (SCROLL THROTTLER ENGINE)
    // ==========================================================================
    let performanceTick = false;

    function handleGlobalWindowScroll() {
        if (!performanceTick) {
            window.requestAnimationFrame(function () {
                processTimelineProgressScroll();
                applyVisualParallaxTransformations();
                performanceTick = false;
            });
            performanceTick = true;
        }
    }

    // ==========================================================================
    // СИСТЕМНИЙ ЗАПУСК КОРЕНЯ (ORCHESTRATOR ENTRY POINT)
    // ==========================================================================
    function mainApplicationBootstrap() {
        logDiagnostics("Core", "Початок складання модулів інтерфейсу.");

        setupEnvelopeInteraction();
        startWeddingCountdownClock();
        runScratchInitialization();
        setupGuestsGalleryManager();
        runRsvpFormSubsystem();

        window.addEventListener("scroll", handleGlobalWindowScroll, { passive: true });
        
        logDiagnostics("Core", "Всі компоненти весільного сайту готові до роботи.");
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", mainApplicationBootstrap);
    } else {
        mainApplicationBootstrap();
    }
    function mainApplicationBootstrap() {
        logDiagnostics("Core", "Початок складання модулів...");

        // Існуючі системи
        setupEnvelopeInteraction();
        startWeddingCountdownClock();
        runScratchInitialization();
        setupGuestsGalleryManager();
        runRsvpFormSubsystem();

        // НОВІ СИСТЕМИ (Це і додає обсяг та красу)
        DynamicStyles.injectCustomAnimations();
        AnimationFactory.revealEffect('.reveal-item');
        AnimationFactory.applySilkShimmer();
        EventManager.attachGlobalInteractions();

        window.addEventListener("scroll", handleGlobalWindowScroll, { passive: true });
        
        logDiagnostics("Core", "Всі компоненти активовано.");
    }
})();

// ==========================================================================
    // 11. АНІМАЦІЙНА ФАБРИКА (EXTENDED ANIMATION CONTROLLER)
    // ==========================================================================
    const AnimationFactory = {
        // Ефект поступового "проявлення" елементів
        revealEffect: function(selector, threshold = 0.5) {
            const elements = document.querySelectorAll(selector);
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.style.transition = "opacity 1.2s ease, transform 1s cubic-bezier(0.2, 0.8, 0.2, 1)";
                        entry.target.style.opacity = "1";
                        entry.target.style.transform = "translateY(0)";
                    }
                });
            }, { threshold });

            elements.forEach(el => {
                el.style.opacity = "0";
                el.style.transform = "translateY(30px)";
                observer.observe(el);
            });
        },

        // Динамічний ефект "шовкового мерехтіння" для заголовків
        applySilkShimmer: function() {
            const headings = document.querySelectorAll('.cursive-heading');
            headings.forEach(h => {
                h.style.position = 'relative';
                h.style.overflow = 'hidden';
                const shimmer = document.createElement('div');
                shimmer.style.cssText = `
                    position: absolute; top:0; left: -100%; width: 50%; height: 100%;
                    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
                    animation: silkShimmer 3s infinite;
                `;
                h.appendChild(shimmer);
            });
        }
    };

    // ==========================================================================
    // 12. ДИНАМІЧНИЙ СТИЛОВИЙ ДВИГУН (DYNAMIC STYLES MANAGER)
    // ==========================================================================
    const DynamicStyles = {
        injectCustomAnimations: function() {
            const style = document.createElement('style');
            style.innerHTML = `
                @keyframes silkShimmer {
                    0% { left: -100%; }
                    100% { left: 200%; }
                }
                .petal {
                    position: fixed; top: -20px; z-index: 999;
                    border-radius: 50% 0% 50% 50%;
                    pointer-events: none;
                    animation: fall linear forwards;
                }
                @keyframes fall {
                    to { transform: translateY(100vh) rotate(360deg); }
                }
                .node-active {
                    transform: scale(1.2);
                    transition: transform 0.3s ease;
                    border-color: #c59f52 !important;
                }
                .luxury-input-group:focus-within .floating-field-label {
                    transform: translateY(-20px) scale(0.8);
                    color: #c59f52;
                }
            `;
            document.head.appendChild(style);
        }
    };

    // ==========================================================================
    // 13. ПОШИРЕНА ОБРОБКА ПОДІЙ (ADVANCED EVENT MANAGER)
    // ==========================================================================
    const EventManager = {
    attachGlobalInteractions: function() {
        if (window.matchMedia("(pointer: fine)").matches) { // Додайте цю перевірку
            const buttons = document.querySelectorAll('.premium-submit-button');
            buttons.forEach(btn => {
                btn.addEventListener('mousemove', (e) => {
                    const rect = btn.getBoundingClientRect();
                    const x = e.clientX - rect.left - rect.width / 2;
                    const y = e.clientY - rect.top - rect.height / 2;
                    btn.style.transform = `translate(${x * 0.1}px, ${y * 0.1}px)`;
                });
                btn.addEventListener('mouseleave', () => {
                    btn.style.transform = 'translate(0, 0)';
                });
            });
        }
    }
};