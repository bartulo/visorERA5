varying vec2 vUv;
varying vec3 vPosition;

void main() {

  vPosition = position;
  vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );

  vUv = uv;

  gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

}
