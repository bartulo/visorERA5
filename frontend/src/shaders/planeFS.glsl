uniform sampler2D temp_ini;
uniform sampler2D temp_fin;
uniform sampler2D press_ini;
uniform sampler2D press_fin;
uniform sampler2D europa;
uniform float time;
uniform float anim_speed;
uniform float tmin;
uniform float tmax;
uniform float stepTemp;
uniform float interpolation;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vViewPosition;

vec3 color_map(in float x) {
  const vec4 kRedVec4 = vec4(0.13572138, 4.61539260, -42.66032258, 132.13108234);
  const vec4 kGreenVec4 = vec4(0.09140261, 2.19418839, 4.84296658, -14.18503333);
  const vec4 kBlueVec4 = vec4(0.10667330, 12.64194608, -60.58204836, 110.36276771);
  const vec2 kRedVec2 = vec2(-152.94239396, 59.28637943);
  const vec2 kGreenVec2 = vec2(4.27729857, 2.82956604);
  const vec2 kBlueVec2 = vec2(-89.90310912, 27.34824973);
  
  x = clamp(x,0.0,1.0);
  vec4 v4 = vec4( 1.0, x, x * x, x * x * x);
  vec2 v2 = v4.zw * v4.z;
  return vec3(
    dot(v4, kRedVec4)   + dot(v2, kRedVec2),
    dot(v4, kGreenVec4) + dot(v2, kGreenVec2),
    dot(v4, kBlueVec4)  + dot(v2, kBlueVec2)
  );
}

void main() {

  vec4 tColor0 = texture2D( temp_ini, vUv );
  vec4 tColor6 = texture2D( temp_fin, vUv );
  vec4 pColor0 = texture2D( press_ini, vUv );
  vec4 pColor6 = texture2D( press_fin, vUv );
  vec4 euro = texture2D( europa, vUv );
  float norm0 = (tColor0.r - 273. - tmin) / (tmax - tmin);
  float norm6 = (tColor6.r - 273. - tmin) / (tmax - tmin);
  float fColor0 = ceil(norm0 * stepTemp) / stepTemp;
  float fColor6 = ceil(norm6 * stepTemp) / stepTemp;
  float m = mix(fColor0, fColor6, time * interpolation);
  vec3 c = color_map(m);
  vec3 final_ = mix(vec3(1.,1.,1.), c, euro.r);


  float isobaraIni = step(-5., (mod(pColor0.r, 100.)) * -1.);
  float isobaraFin = step(-5., (mod(pColor6.r, 100.)) * -1.);
  float i = mix(isobaraIni, isobaraFin, time * interpolation);

  vec3 final = mix(final_, vec3(0.), isobaraIni);

  gl_FragColor = vec4(final, 1.);
  //gl_FragColor = vec4(i, 0., 0., 1.);

}
