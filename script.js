// @ts-check
/** @type {HTMLCollectionOf<HTMLCanvasElement>} */
var ss;
/** @type {HTMLCollectionOf<HTMLCanvasElement>} */
var cs;
var rate, max;
function init() {
    // @ts-ignore
    ss = document.getElementsByClassName("canvas-sum");
    // @ts-ignore
    cs = document.getElementsByClassName("canvas-part");
    rate = window.innerWidth - 18;
    max = (window.innerHeight / 4 - 10);
    requestAnimationFrame(animate);
}
/**
 * @param {number} f
 * @param {number} a
 */
function sin(f, a, s = 0) {
    return Array.from(Array(rate), (_, i) => a * Math.sin(s * 2 * Math.PI + i * f));
};
/**
 * @param {HTMLCanvasElement} w
 * @param {number[]} x
 */
function render(w, x) {
    w.width = rate;
    w.height = max;
    const ctx = w.getContext("2d");
    if (x.length)
        ctx.moveTo(0, x[0]);
    for (const [i, e] of x.entries())
        ctx.lineTo(i, max / 2 * (1 - e));
    ctx.stroke();
}
/**
 * @param {number[]} x
 * @param {number[]} y
 */
function add(x, y) {
    console.assert(x.length == y.length);
    return x.map((e, i) => e + y[i]);
};

function animate() {
    let a = sin(.1, .333 * Math.sin(Date.now() / 1e3), Date.now() / 1e4)
    let b = sin(.2 + .1 * Math.sin(Date.now() / 1e4), .333, Date.now() / 1e3);
    let c = sin(1 / Math.PI, .333, Date.now() / 5e3);
    let s = add(add(a, b), c);
    render(ss[0], s);
    render(cs[0], a);
    render(cs[1], b);
    render(cs[2], c);
    requestAnimationFrame(animate);
}
window.addEventListener('load', init);
window.addEventListener('resize', init);