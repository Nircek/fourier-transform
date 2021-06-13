// @ts-check
/** @type {HTMLElement} */ var ss;
/** @type {HTMLElement[]} */ var cs = [];
/** @type {number} */ var rate;
/** @type {number?} */ var raf;

function init() {
    var osc = document.getElementsByClassName("oscilloscope")[0];
    for (let i = 0; i < 3; ++i)
        osc.parentElement.appendChild(osc.cloneNode(true));
    // @ts-ignore
    cs = [...document.getElementsByClassName("oscilloscope")];
    ss = cs.splice(0, 1)[0];
    ss.getElementsByClassName("controls")[0].remove();
    refresh();
}

function refresh() {
    rate = canvas(ss).offsetWidth;
    for (let c of [ss, ...cs])
        canvas(c).width = rate;
    if (raf !== undefined)
        cancelAnimationFrame(raf);
    raf = requestAnimationFrame(animate);
}

/**
 * @param {HTMLElement} e
 */
function canvas(e) {
    return e.getElementsByTagName('canvas')[0];
}

/**
 * @param {number} f
 */
function sin(f, a = 1, s = 0) {
    return Array.from(Array(rate), (_, i) => a * Math.sin(s * 2 * Math.PI + i * f));
};

/**
 * @param {HTMLCanvasElement} w
 */
function clear(w) {
    w.getContext("2d").clearRect(0, 0, w.width, w.height);
}

/**
 * @param {HTMLCanvasElement} w
 * @param {number[]} x
 * @param {string | CanvasGradient | CanvasPattern} s
 */
function render(w, x, s = "black") {
    const ctx = w.getContext("2d");
    ctx.strokeStyle = s;
    ctx.beginPath();
    const margin = 8;
    /** @param {number} e */
    const off = e => margin + (w.height / 2 - margin) * (1 - e);
    if (x.length)
        ctx.moveTo(0, off(x[0]));
    for (const [i, e] of x.entries())
        ctx.lineTo(i, off(e));
    ctx.stroke();
}

/**
 * @param {number[][]} args
 */
function avg(...args) {
    return args[0].map((_, i) => args.map(e => e[i]).reduce((p, n) => p + n, 0) / args.length);
};

function animate() {
    let a = sin(.1, Math.sin(Date.now() / 1e3), Date.now() / 1e4)
    let b = sin(.2 + .1 * Math.sin(Date.now() / 1e4), 1, Date.now() / 1e3);
    let c = sin(1 / Math.PI, 1, Date.now() / 5e3);
    let s = avg(a, b, c);
    for (let c of [ss, ...cs])
        clear(canvas(c));
    render(canvas(ss), s);
    render(canvas(cs[0]), a);
    render(canvas(cs[1]), b);
    render(canvas(cs[2]), c);
    raf = requestAnimationFrame(animate);
}
window.addEventListener('load', init);
window.addEventListener('resize', refresh);
