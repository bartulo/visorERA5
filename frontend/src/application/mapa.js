import { 
  DataTexture, 
  Scene, 
  PerspectiveCamera, 
  WebGLRenderer,
  AmbientLight,
  Mesh,
  RedFormat,
  FloatType,
  ShaderMaterial,
  PlaneGeometry,
  LinearFilter,
  Clock,
  TextureLoader
} from 'three';

class Mapa {
  constructor() {
    this.clock = new Clock();
    this.fraccion = 0;
    this.anim_speed = 2;
    this.api_url = window.location.pathname.replace('mapa', 'api');
    this.planeVS = require('../shaders/planeVS.glsl');
    this.planeFS = require('../shaders/planeFS.glsl');
    this.europa_img = require('../../vendors/images/europa.png');
  }

  async get_datos() {
    const response = await fetch(this.api_url);
    this.datos = await response.json();
    this.width = this.datos.datos[0].length;
    this.height = this.datos.datos[0][0].length;
    this.temp_textures = [];
    this.datos.datos.forEach((element) => {
      const tarray = element.flat().map((x) => (x -277) / 30);
      const tarray32 = new Float32Array(tarray);
      const texture = new DataTexture(tarray32, this.height, this.widht, RedFormat, FloatType);
      texture.magFilter = LinearFilter;
      texture.flipy = true;
      texture.needsUpdate = true;
      this.temp_textures.push(texture);
    });

    const a = this.datos.datos[0].flat().map((x) => ( x - 277 ) / 30);
    const b = this.datos.datos[1].flat().map((x) => ( x - 277 ) / 30);
    const c = this.datos.datos[2].flat().map((x) => ( x - 277 ) / 30);
    const d = this.datos.datos[3].flat().map((x) => ( x - 277 ) / 30);
    this.d0 = new Float32Array(a);
    this.d6 = new Float32Array(b);
    this.d12 = new Float32Array(c);
    this.d18 = new Float32Array(d);

  }

  init() {
    this.time = ( this.clock.getElapsedTime() % this.anim_speed ) / this.anim_speed;
    this.scene = new Scene();
    this.camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.renderer = new WebGLRenderer({antialias: true});
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(this.renderer.domElement);

    this.camera.position.z = 380;
    const ambientLight = new AmbientLight(0xffffff, 5.9);
    this.scene.add(ambientLight);

    this.europa = new TextureLoader().load(this.europa_img);
    this.europa.needsUpdate = true;

    this.temp_texture0 = new DataTexture(this.d0, this.height, this.width, RedFormat, FloatType);
    this.temp_texture0.magFilter = LinearFilter;
    this.temp_texture0.flipY = true;
    this.temp_texture0.needsUpdate = true;

    this.temp_texture6 = new DataTexture(this.d6, this.height, this.width, RedFormat, FloatType);
    this.temp_texture6.magFilter = LinearFilter;
    this.temp_texture6.flipY = true;
    this.temp_texture6.needsUpdate = true;

    this.temp_texture12 = new DataTexture(this.d12, this.height, this.width, RedFormat, FloatType);
    this.temp_texture12.magFilter = LinearFilter;
    this.temp_texture12.flipY = true;
    this.temp_texture12.needsUpdate = true;

    this.temp_texture18 = new DataTexture(this.d18, this.height, this.width, RedFormat, FloatType);
    this.temp_texture18.magFilter = LinearFilter;
    this.temp_texture18.flipY = true;
    this.temp_texture18.needsUpdate = true;

    const uniforms = {
      time: {type: 'f', value: this.time},
      anim_speed: {type: 'f', value: this.anim_speed},
      europa: {type: 't', value: this.europa},
      temp_ini: {type: 't', value: this.temp_textures[0]},
      temp_fin: {type: 't', value: this.temp_textures[1]}
    };
    
    this.material = new ShaderMaterial({
      uniforms: uniforms,
      vertexShader: this.planeVS,
      fragmentShader: this.planeFS
    });
    const geom = new PlaneGeometry(680, 680 * this.width / this.height, 1, 1);
    this.material.needsUpdate = true;

    const plane = new Mesh(geom, this.material);
    this.scene.add(plane);

    this.render();

  }

  render() {
    requestAnimationFrame(this.render.bind(this));

    const index = Math.floor(this.clock.getElapsedTime() / this.anim_speed);
//    if (this.time >= this.anim_speed & this.time < this.anim_speed * 2 & this.clock.elapsedTime >= this.anim_speed) {
//      this.fraccion = this.anim_speed;
//      this.clock.elapsedTime = 0;
      this.material.uniforms.temp_ini.value = this.temp_textures[index];
      this.material.uniforms.temp_fin.value = this.temp_textures[index + 1];
//    }

//    if (this.time >= this.anim_speed * 2 & this.time < this.anim_speed * 3 & this.clock.elapsedTime >= this.anim_speed) {
//      this.fraccion = this.anim_speed * 2;
//      this.clock.elapsedTime = 0;
//      this.material.uniforms.temp_ini.value = this.temp_texture12;
//      this.material.uniforms.temp_fin.value = this.temp_texture18;
//    }
//
//    if (this.time >= this.anim_speed * 3 & this.clock.elapsedTime >= this.anim_speed) {
//      this.fraccion = 0;
//      this.clock.elapsedTime = 0;
//      this.time = 0;
//      this.material.uniforms.temp_ini.value = this.temp_texture0;
//      this.material.uniforms.temp_fin.value = this.temp_texture6;
//    }
//    this.material.uniforms.time.value = this.clock.elapsedTime;
//
    this.renderer.render(this.scene, this.camera);
  }

}

const mapa = new Mapa();
document.body.addEventListener('click', () => {
  console.log(mapa.time);
  console.log(mapa.clock.elapsedTime);
  console.log(mapa.europa);
});
mapa.get_datos().then(() => {
  mapa.init();
});
