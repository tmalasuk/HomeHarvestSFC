class StorageService {
    // Compresses and returns the photo as a base64 JPEG data URL (no Firebase Storage upload)
    static uploadRecipePhoto(_householdId, _recipeId, file) {
        return this._compressImage(file, 800, 0.78)
    }

    // Draws the image onto a canvas at reduced dimensions and returns a JPEG data URL
    static _compressImage(file, maxDimension, quality) {
        return new Promise((resolve, reject) => {
            const img = new Image()
            const objectUrl = URL.createObjectURL(file)
            img.onload = () => {
                URL.revokeObjectURL(objectUrl)
                let { width, height } = img
                if (width > maxDimension || height > maxDimension) {
                    if (width >= height) {
                        height = Math.round((height * maxDimension) / width)
                        width = maxDimension
                    } else {
                        width = Math.round((width * maxDimension) / height)
                        height = maxDimension
                    }
                }
                const canvas = document.createElement('canvas')
                canvas.width = width
                canvas.height = height
                canvas.getContext('2d').drawImage(img, 0, 0, width, height)
                resolve(canvas.toDataURL('image/jpeg', quality))
            }
            img.onerror = reject
            img.src = objectUrl
        })
    }
}

export default StorageService
