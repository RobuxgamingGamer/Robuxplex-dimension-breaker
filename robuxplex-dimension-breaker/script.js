const canvas = document.getElementById("glcanvas");
const gl = canvas.getContext("webgl");

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  gl.viewport(0, 0, canvas.width, canvas.height);
}
resize();
window.addEventListener("resize", resize);

// ===== SHADERS =====

// Vertex Shader
const vertexShaderSrc = `
attribute vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

// Fragment Shader (THE DIMENSION BREAKER)
const fragmentShaderSrc = `
precision highp float;

uniform float time;
uniform vec2 resolution;

// 4D rotation system
vec4 get4D(float t, float offset) {
    float a = t * 0.6 + offset;
    float b = t * 0.35 + offset * 1.3;

    float x = cos(a);
    float y = sin(a);
    float z = cos(b);
    float w = sin(b);

    return vec4(x, y, z, w);
}

// Dimensional collapse projection
vec2 project(vec4 p) {
    float alpha = 0.7;
    float beta = 0.7;

    float X = p.x / (1.0 + alpha * p.w);
    float Y = p.y / (1.0 + beta * p.z);

    return vec2(X, Y);
}

void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5 * resolution) / resolution.y;

    float t = time * 0.5;

    vec3 color = vec3(0.0);

    // CORE LOOP (more stable + deeper effect)
    for (int i = 0; i < 80; i++) {
        float fi = float(i) * 0.08;

        vec4 p4 = get4D(t, fi);
        vec2 p2 = project(p4);

        float d = length(uv - p2);

        // sharper glow curve
        float glow = 0.015 / (d * d + 0.0005);

        vec3 col = vec3(
            sin(t + fi * 1.2),
            cos(t * 0.7 + fi),
            sin(t * 0.4 + fi * 1.5)
        );

        color += col * glow;
    }

    // smooth tone mapping
    color = color / (1.0 + color);

    // slight gamma correction
    color = pow(color, vec3(0.9));

    gl_FragColor = vec4(color, 1.0);
}
`;

// ===== SHADER SETUP =====

function createShader(type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  return shader;
}

const vs = createShader(gl.VERTEX_SHADER, vertexShaderSrc);
const fs = createShader(gl.FRAGMENT_SHADER, fragmentShaderSrc);

const program = gl.createProgram();
gl.attachShader(program, vs);
gl.attachShader(program, fs);
gl.linkProgram(program);
gl.useProgram(program);

// Fullscreen quad
const buffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
  -1,-1,  1,-1,  -1,1,
  -1,1,   1,-1,   1,1
]), gl.STATIC_DRAW);

const position = gl.getAttribLocation(program, "position");
gl.enableVertexAttribArray(position);
gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

// Uniforms
const timeLoc = gl.getUniformLocation(program, "time");
const resLoc = gl.getUniformLocation(program, "resolution");

// ===== RENDER LOOP =====

function render(t) {
  gl.uniform1f(timeLoc, t * 0.001);
  gl.uniform2f(resLoc, canvas.width, canvas.height);

  gl.drawArrays(gl.TRIANGLES, 0, 6);

  requestAnimationFrame(render);
}

requestAnimationFrame(render);