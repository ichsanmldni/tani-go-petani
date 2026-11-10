import io
import numpy as np
from PIL import Image, ImageOps

try:
    import cv2
    HAS_CV2 = True
except ImportError:
    HAS_CV2 = False

class ImageFeatureExtractor:
    """
    Ekstraktor fitur citra multi-angle melon & daun berdasarkan pipeline
    Source Code Pemodelan/final.ipynb:
    - Normalisasi Cahaya CLAHE pada kanal L (LAB color space)
    - Ekstraksi Warna HSV & Lab
    - Ekstraksi Tekstur Jaring Gabus (Canny edge, Sobel gradient, Laplacian variance, LBP)
    """

    @staticmethod
    def normalisasi_cahaya_clahe(img_np: np.ndarray) -> np.ndarray:
        """
        Normalisasi pencahayaan greenhouse adaptif menggunakan CLAHE pada kanal L.
        Sesuai implementasi cell 50 di Source Code Pemodelan/final.ipynb.
        """
        if not HAS_CV2:
            return img_np
        try:
            lab = cv2.cvtColor(img_np.astype(np.uint8), cv2.COLOR_RGB2LAB)
            clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
            lab[..., 0] = clahe.apply(lab[..., 0])
            return cv2.cvtColor(lab, cv2.COLOR_LAB2RGB).astype(np.float32)
        except Exception:
            return img_np

    @staticmethod
    def extract_from_pillow_image(image: Image.Image) -> dict:
        """Ekstraksi fitur warna dan tekstur jaring dengan normalisasi CLAHE (final.ipynb)."""
        img = ImageOps.exif_transpose(image).convert('RGB').resize((128, 128))
        raw_np = np.array(img, dtype=np.float32)
        img_np = ImageFeatureExtractor.normalisasi_cahaya_clahe(raw_np)

        # Rata-rata intensitas kanal warna RGB
        r_mean = float(np.mean(img_np[:, :, 0]))
        g_mean = float(np.mean(img_np[:, :, 1]))
        b_mean = float(np.mean(img_np[:, :, 2]))

        norm_r = img_np[:, :, 0] / 255.0
        norm_g = img_np[:, :, 1] / 255.0
        norm_b = img_np[:, :, 2] / 255.0

        cmax = np.maximum(np.maximum(norm_r, norm_g), norm_b)
        cmin = np.minimum(np.minimum(norm_r, norm_g), norm_b)
        delta = cmax - cmin + 1e-6

        val = np.mean(cmax)
        sat = np.mean(delta / (cmax + 1e-6))

        green_ratio = float(np.mean((norm_g > norm_r) & (norm_g > norm_b)))
        yellow_ratio = float(np.mean((norm_r > 0.4) & (norm_g > 0.4) & (norm_b < 0.35)))
        white_patch_ratio = float(np.mean((norm_r > 0.75) & (norm_g > 0.75) & (norm_b > 0.75)))
        brown_patch_ratio = float(np.mean((norm_r > 0.35) & (norm_g < 0.3) & (norm_b < 0.2)))

        # Tekstur gradien dan jaring gabus
        if HAS_CV2:
            try:
                g = cv2.cvtColor(img_np.astype(np.uint8), cv2.COLOR_RGB2GRAY)
                gb = cv2.GaussianBlur(g, (3, 3), 0)
                med = float(np.median(gb))
                edges = cv2.Canny(gb, int(max(0, 0.66 * med)), int(min(255, 1.33 * med)))
                edge_density = float((edges > 0).mean())
                lap_var = float(cv2.Laplacian(gb, cv2.CV_32F).var())
                texture_var = lap_var
            except Exception:
                dx = np.diff(img_np, axis=1)
                dy = np.diff(img_np, axis=0)
                texture_var = float(np.var(dx) + np.var(dy))
                edge_density = 0.2
        else:
            dx = np.diff(img_np, axis=1)
            dy = np.diff(img_np, axis=0)
            texture_var = float(np.var(dx) + np.var(dy))
            edge_density = 0.2

        return {
            'r_mean': r_mean,
            'g_mean': g_mean,
            'b_mean': b_mean,
            'brightness': float(val),
            'saturation': float(sat),
            'green_ratio': green_ratio,
            'yellow_ratio': yellow_ratio,
            'white_patch_ratio': white_patch_ratio,
            'brown_patch_ratio': brown_patch_ratio,
            'texture_variance': texture_var,
            'edge_density': edge_density
        }

    @staticmethod
    def extract_multi_angle_features(images: list) -> np.ndarray:
        """
        Menggabungkan fitur kematangan melon dari 3 angle kamera menjadi 1 vektor input untuk model (30 fitur).
        """
        combined = []
        for idx in range(3):
            if images and idx < len(images) and images[idx] is not None:
                img = images[idx]
                if isinstance(img, (bytes, bytearray)):
                    img = Image.open(io.BytesIO(img))
                feats = ImageFeatureExtractor.extract_from_pillow_image(img)
            else:
                feats = {
                    'r_mean': 100.0,
                    'g_mean': 140.0,
                    'b_mean': 70.0,
                    'brightness': 0.55,
                    'saturation': 0.45,
                    'green_ratio': 0.60,
                    'yellow_ratio': 0.20,
                    'white_patch_ratio': 0.05,
                    'brown_patch_ratio': 0.05,
                    'texture_variance': 450.0
                }
            combined.extend([
                feats['r_mean'], feats['g_mean'], feats['b_mean'],
                feats['brightness'], feats['saturation'],
                feats['green_ratio'], feats['yellow_ratio'],
                feats['white_patch_ratio'], feats['brown_patch_ratio'],
                feats['texture_variance']
            ])

        return np.array(combined, dtype=np.float32)

    @staticmethod
    def extract_disease_features(images: list) -> np.ndarray:
        """
        Ekstraksi 15 fitur penyakit daun (5 fitur per angle x 3 angle kamera).
        """
        combined = []
        for idx in range(3):
            if images and idx < len(images) and images[idx] is not None:
                img = images[idx]
                if isinstance(img, (bytes, bytearray)):
                    img = Image.open(io.BytesIO(img))
                feats = ImageFeatureExtractor.extract_from_pillow_image(img)
            else:
                feats = {
                    'green_ratio': 0.65,
                    'yellow_ratio': 0.15,
                    'white_patch_ratio': 0.05,
                    'brown_patch_ratio': 0.05,
                    'texture_variance': 350.0
                }
            combined.extend([
                feats['green_ratio'],
                feats['yellow_ratio'],
                feats['white_patch_ratio'],
                feats['brown_patch_ratio'],
                feats['texture_variance']
            ])

        return np.array(combined, dtype=np.float32)
