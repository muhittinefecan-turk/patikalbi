"""
Pati Kalbi v2.0 — Blender Python CLI 3D Model Optimizasyon Betiği

Kullanım:
  blender --background --python scripts/optimize_3d_blender.py -- \
    --input raw_scan.glb \
    --output-dir out/pamuk \
    --shoulder-height-cm 42 \
    --target-tris 35000

Ne yapar:
  1. Ham modeli (.glb/.gltf/.obj/.fbx) sahneye alır.
  2. Taban noktasını (min Z) tam (0, 0, 0) zemin merkezine oturtur.
  3. Hayvanın gerçek omuz yüksekliğine (cm -> metre) göre 1:1 gerçek ölçekler.
  4. Decimate ile poligon sayısını mobil WebGL/AR bütçesine (25k–45k üçgen) düşürür.
  5. Eşzamanlı olarak Draco/Meshopt uyumlu .glb (Web & Android AR) ve .usdz (iOS Quick Look) üretir.
"""

import argparse
import os
import sys

try:
    import bpy
    from mathutils import Vector
except ImportError:
    print("Bu betik Blender CLI içinden çalıştırılmalıdır: blender --background --python scripts/optimize_3d_blender.py -- ...")
    sys.exit(1)


def parse_args():
    argv = sys.argv
    if "--" in argv:
        argv = argv[argv.index("--") + 1 :]
    else:
        argv = []
    parser = argparse.ArgumentParser(description="Pati Kalbi 3D/AR Optimizasyon Hattı")
    parser.add_argument("--input", required=True, help="Ham 3D dosya yolu (.glb/.obj/.fbx)")
    parser.add_argument("--output-dir", required=True, help="Çıktı klasörü")
    parser.add_argument("--shoulder-height-cm", type=float, required=True, help="Gerçek omuz yüksekliği (cm)")
    parser.add_argument("--target-tris", type=int, default=35000, help="Hedef üçgen sayısı")
    return parser.parse_args(argv)


def clear_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)


def import_model(path: str):
    ext = os.path.splitext(path)[1].lower()
    if ext in (".glb", ".gltf"):
        bpy.ops.import_scene.gltf(filepath=path)
    elif ext == ".obj":
        bpy.ops.wm.obj_import(filepath=path)
    elif ext == ".fbx":
        bpy.ops.import_scene.fbx(filepath=path)
    else:
        raise ValueError(f"Desteklenmeyen dosya uzantısı: {ext}")


def compute_bounds(meshes):
    min_co = Vector((float("inf"), float("inf"), float("inf")))
    max_co = Vector((float("-inf"), float("-inf"), float("-inf")))
    for obj in meshes:
        for corner in obj.bound_box:
            world_co = obj.matrix_world @ Vector(corner)
            min_co.x = min(min_co.x, world_co.x)
            min_co.y = min(min_co.y, world_co.y)
            min_co.z = min(min_co.z, world_co.z)
            max_co.x = max(max_co.x, world_co.x)
            max_co.y = max(max_co.y, world_co.y)
            max_co.z = max(max_co.z, world_co.z)
    return min_co, max_co


def normalize_and_scale(meshes, shoulder_height_cm: float):
    min_co, max_co = compute_bounds(meshes)
    current_height = max(max_co.z - min_co.z, 1e-4)
    # Baş yüksekliği omuz yüksekliğinin yaklaşık 1.28 katıdır
    target_total_height_m = (shoulder_height_cm / 100.0) * 1.28
    scale_factor = target_total_height_m / current_height
    center_x = (min_co.x + max_co.x) / 2.0
    center_y = (min_co.y + max_co.y) / 2.0

    for obj in meshes:
        obj.location.x -= center_x
        obj.location.y -= center_y
        obj.location.z -= min_co.z
        obj.scale *= scale_factor
    bpy.context.view_layer.update()
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)


def decimate_meshes(meshes, target_tris: int):
    total_tris = sum(len(m.data.polygons) for m in meshes)
    if total_tris <= target_tris or total_tris == 0:
        return
    ratio = max(0.05, min(1.0, target_tris / float(total_tris)))
    for obj in meshes:
        mod = obj.modifiers.new(name="PatiKalbiDecimate", type="DECIMATE")
        mod.ratio = ratio
        bpy.context.view_layer.objects.active = obj
        bpy.ops.object.modifier_apply(modifier=mod.name)


def main():
    args = parse_args()
    os.makedirs(args.output_dir, exist_ok=True)
    clear_scene()
    import_model(args.input)

    meshes = [o for o in bpy.context.scene.objects if o.type == "MESH"]
    if not meshes:
        raise RuntimeError("Girdi dosyasında mesh bulunamadı.")

    normalize_and_scale(meshes, args.shoulder_height_cm)
    decimate_meshes(meshes, args.target_tris)

    base_name = os.path.splitext(os.path.basename(args.input))[0]
    glb_path = os.path.join(args.output_dir, f"{base_name}.glb")
    usdz_path = os.path.join(args.output_dir, f"{base_name}.usdz")

    bpy.ops.export_scene.gltf(
        filepath=glb_path,
        export_format="GLB",
        export_draco_mesh_compression_enable=True,
        export_image_format="WEBP",
        export_image_quality=82,
        export_yup=True,
    )
    bpy.ops.wm.usd_export(
        filepath=usdz_path,
        export_textures=True,
        relative_paths=True,
    )

    glb_mb = os.path.getsize(glb_path) / (1024 * 1024)
    print(f"[Pati Kalbi] Hazır: {glb_path} ({glb_mb:.2f} MB) & {usdz_path}")
    if glb_mb > 5.0:
        print("[Uyarı] .glb boyutu 5 MB üzerinde — dokuları 1024px WebP olarak küçültmeniz önerilir.")


if __name__ == "__main__":
    main()
