from pathlib import Path
from PIL import Image

# Folder containing your original images
INPUT_DIR = Path("images")

# Folder where optimized copies will be saved
OUTPUT_DIR = INPUT_DIR / "optimized"

# Maximum width/height allowed
MAX_SIZE = 2000

OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

for image_path in INPUT_DIR.iterdir():

    if image_path.suffix.lower() not in [".png", ".jpg", ".jpeg", ".webp"]:
        continue

    try:
        with Image.open(image_path) as img:

            original_size = img.size

            # Make a copy so the original is never modified
            img = img.copy()

            # Resize only if necessary
            img.thumbnail((MAX_SIZE, MAX_SIZE), Image.Resampling.LANCZOS)

            output_path = OUTPUT_DIR / image_path.name

            # Preserve PNG transparency
            if image_path.suffix.lower() == ".png":
                img.save(output_path, "PNG", optimize=True)
            else:
                img.save(output_path, quality=90, optimize=True)

            print(
                f"✓ {image_path.name}: "
                f"{original_size[0]}x{original_size[1]} → "
                f"{img.width}x{img.height}"
            )

    except Exception as e:
        print(f"✗ {image_path.name}: {e}")

print("\nDone!")
print(f"Optimized images are in: {OUTPUT_DIR}")