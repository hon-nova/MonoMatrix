const fs = require("fs");
const PNG = require("pngjs").PNG;
const path = require("path");
const yauzl = require("yauzl-promise");
const { pipeline } = require("stream/promises");

/**
 * Description: decompress file from given pathIn, write to given pathOut
 *
 * @param {string} pathIn
 * @param {string} pathOut
 * @return {promise}
 */
const pathIn = path.join(__dirname, "myfile.zip");
const pathOut = path.join(__dirname, "unzipped");
// const grayScaleFolder = path.join(__dirname,'grayscale')

const ensureFoldersExist = async()=>{
   try {
      await fs.stat(pathOut)
      await fs.stat(grayScaleFolder)
      console.log(`folder files/ exists`)
   } catch(error){
      console.log(`folder unzipped/ does not exist: `,error)
      await fs.mkdir(pathOut, {recursive: true})
      await fs.mkdir(grayScaleFolder, {recursive: true})
      console.log(`Folder unzipped just got created.`)
   }
}
const unzip = async (pathIn, pathOut) => {
   
  const zip = await yauzl.open(pathIn);
  // console.log(`zip: `,zip)

  try {
   // await ensureFoldersExist()
   for await (const entry of zip) {
      // console.log(`each entry of zip: `,entry)
      const entryPath = path.join(pathOut, entry.filename);
      const entryName = entry.filename;
      if (!entryName.startsWith("__MACOSX/")) {
        // console.log(`entryName: `,entryName)
        const readStream = await entry.openReadStream();
        const writeStream = fs.createWriteStream(`${pathOut}/${entryName}`);
        await pipeline(readStream, writeStream);
      }
    }
  } catch (error) {
    console.log(`CATCH ZIP: `, error);
  } finally {
    await zip.close();
  }
};

// unzip(pathIn, pathOut)
   

/**
 * Description: read all the png files from given directory and return Promise containing array of each png file path
 *
 * @param {string} path
 * @return {promise}
 */
const readDir = (dir) => {};

/**
 * Description: Read in png file by given pathIn,
 * convert to grayscale and write to given pathOut
 *
 * @param {string} filePath
 * @param {string} pathProcessed
 * @return {promise}
 */
const unzippedDir = path.join(__dirname, "unzipped/");
const grayscaledDir = path.join(__dirname, "grayscaled/");
console.log(`unzippedDir: `)
console.log(unzippedDir)
console.log(`grayscaledDir:`)
console.log(grayscaledDir)

const grayScale = async (pathIn, pathOut) => {
   try {
      fs.createReadStream(pathIn)
        .pipe(new PNG({ filterType: 4 }))
        .on("parsed", function () {
             for (let y = 0; y < this.height; y++) {
                for (let x = 0; x < this.width; x++) {
                   const idx = (this.width * y + x) << 2;
                   const red = this.data[idx];
                   const green = this.data[idx + 1];
                   const blue = this.data[idx + 2];
                   const grey = (red + green + blue) / 3;
    
                   this.data[idx] = grey;
                   this.data[idx + 1] = grey;
                   this.data[idx + 2] = grey;
                }
             }
          this.pack().pipe(fs.createWriteStream(pathOut));
        });
    } catch (error) {
      console.log(`CATCH ERROR: ${error}`);
    }
};


const processImages = async ()=>{
   try {
      const files = await fs.promises.readdir(unzippedDir) //readdir from fs module
      console.log(`all files from unzippedDir:`)
      console.log(files)
      const imageProcessingPromises = files.filter((file)=>file.endsWith(".png")).map((file)=>{
         const pathInImage = path.join(unzippedDir,file)
         const pathOutImage = path.join(grayscaledDir,file)
         return grayScale(pathInImage,pathOutImage)
      })

      await Promise.all(imageProcessingPromises)
      console.log(`Image conversion complete for all images`)
   } catch(error){
      console.log(`CATCH ERROR:  ${error}`)
   }
}
processImages()

module.exports = {
  unzip,
  readDir,
  grayScale,
};
