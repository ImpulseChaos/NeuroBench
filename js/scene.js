class SceneManager {
  constructor() {
    this.renderer = null;
    this.scene    = null;
    this.camera   = null;
    this.raf      = null;
    this.canvas   = null;
    this.objects  = [];
    this.userData = {};
  }

  create(canvasId, setupFn) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas || !window.THREE) return;

    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setClearColor(0x000000, 0);

    this.scene  = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.position.z = 12;

    const ambient = new THREE.AmbientLight(0xffffff, 0.3);
    const point1  = new THREE.PointLight(0xffffff, 0.8, 100);
    point1.position.set(10, 10, 10);
    const point2  = new THREE.PointLight(0xffffff, 0.4, 100);
    point2.position.set(-10, -5, 5);
    this.scene.add(ambient, point1, point2);

    setupFn(this);

    this._onResize = () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', this._onResize);

    return this;
  }

  animate(updateFn) {
    const loop = (t) => {
      this.raf = requestAnimationFrame(loop);
      updateFn(t * 0.001, this);
      this.renderer.render(this.scene, this.camera);
    };
    this.raf = requestAnimationFrame(loop);
  }

  destroy() {
    if (this.raf) cancelAnimationFrame(this.raf);
    window.removeEventListener('resize', this._onResize);
    this.scene && this.scene.traverse(obj => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
        else obj.material.dispose();
      }
    });
    if (this.renderer) {
      this.renderer.dispose();
      this.renderer.forceContextLoss();
    }
    this.renderer = this.scene = this.camera = this.raf = null;
    this.objects = [];
    this.userData = {};
  }
}
