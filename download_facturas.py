import os
import mimetypes
from zipfile import ZipFile

def añadir_extension_y_zippear(temp_dir, zip_path):
    for filename in os.listdir(temp_dir):
        filepath = os.path.join(temp_dir, filename)

        # Ignorar directorios o archivos ya con extensión
        if os.path.isfile(filepath) and '.' not in filename:
            try:
                # Determinar el tipo de archivo basado en el contenido
                with open(filepath, 'rb') as f:
                    # Leemos el primer bloque del archivo para adivinar el tipo MIME
                    mime_type = mimetypes.guess_type(f.name)[0]
                    
                extension = mimetypes.guess_extension(mime_type)

                # Asegurar que se encontró una extensión
                if extension:
                    # Renombrar el archivo con la extensión correcta
                    new_filename = f"{filename}{extension}"
                    new_filepath = os.path.join(temp_dir, new_filename)
                    os.rename(filepath, new_filepath)
                else:
                    print(f"No se encontró una extensión para el tipo de archivo {mime_type} de {filename}")

            except Exception as e:
                print(f"No se pudo determinar la extensión de {filename}: {e}")

    # Crear archivo ZIP
    with ZipFile(zip_path, 'w') as zipf:
        for root, dirs, files in os.walk(temp_dir):
            for file in files:
                zipf.write(os.path.join(root, file), file)

temp_dir = './downloaded/undefined'  # Nombre de tu carpeta con archivos descargados
zip_path = 'initialBuyInvoiceSpain.zip'
añadir_extension_y_zippear(temp_dir, zip_path)
