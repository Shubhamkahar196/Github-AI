// // // Import the functions you need from the SDKs you need
// // import { initializeApp } from "firebase/app";
// // // TODO: Add SDKs for Firebase products that you want to use
// // // https://firebase.google.com/docs/web/setup#available-libraries
// // import {getDownloadURL, getStorage, uploadBytesResumable} from 'firebase/storage'

// // // Your web app's Firebase configuration
// // const firebaseConfig = {
// //   apiKey: process.env.FIREBASE_API_KEY,
// //   authDomain: "github-ai-4d329.firebaseapp.com",
// //   projectId: "github-ai-4d329",
// //   storageBucket: "github-ai-4d329.firebasestorage.app",
// //   messagingSenderId: "760960591477",
// //   appId: "1:760960591477:web:c5320b855c2f6a4d7cba3c"
// // };

// // // Initialize Firebase
// // const app = initializeApp(firebaseConfig);
// // export const storage = getStorage(app)


// // export async function uploadFile(file: File, setProgress?: (progress: number)=> void){
// //     return new Promise((resolve,reject) =>{
// //         try {
// //             const storageRef = ref(storage, file.name)
// //             const uploadTask = uploadBytesResumable(storageRef,file)

// //             uploadTask.on('state_changed',snapshot =>{
// //                 const progress = Math.round((snapshot.bytesTransferred /snapshot.totalBytes) * 100)
// //                 if(setProgress) setProgress(progress)
// //                     switch(snapshot.state){
// //                 case 'paused':
// //                     console.log('upload is paused'); break;
// //                     case 'running':
// //                         console.log('upload is running'); break;
// //             }
// //             },error =>{
// //                 reject(error)
// //             }, () =>{
// //                 getDownloadURL(uploadTask.snapshot.ref).then(downloadUrl => {
// //                     resolve(downloadUrl)
// //                 })
// //             })
// //         } catch (error) {
// //             console.error(error)
// //             reject(error)
// //         }
// //     })
// // }





// // Import the functions you need from the SDKs you need
// import { initializeApp } from "firebase/app";
// import {
//   getDownloadURL,
//   getStorage,
//   ref,
//   uploadBytesResumable,
// } from "firebase/storage";

// // Your web app's Firebase configuration
// const firebaseConfig = {
//   apiKey: process.env.FIREBASE_API_KEY,
//   authDomain: "github-ai-4d329.firebaseapp.com",
//   projectId: "github-ai-4d329",
//   storageBucket: "github-ai-4d329.appspot.com", // ✅ Fixed domain
//   messagingSenderId: "760960591477",
//   appId: "1:760960591477:web:c5320b855c2f6a4d7cba3c",
// };

// // Initialize Firebase
// const app = initializeApp(firebaseConfig);
// export const storage = getStorage(app);

// // Upload function
// export async function uploadFile(
//   file: File,
//   setProgress?: (progress: number) => void
// ): Promise<string> {
//   return new Promise((resolve, reject) => {
//     try {
//       const storageRef = ref(storage, `uploads/${file.name}`); // ✅ Better to keep in a subfolder
//       const uploadTask = uploadBytesResumable(storageRef, file);

//       uploadTask.on(
//         "state_changed",
//         (snapshot) => {
//           const progress = Math.round(
//             (snapshot.bytesTransferred / snapshot.totalBytes) * 100
//           );
//           if (setProgress) setProgress(progress);

//           switch (snapshot.state) {
//             case "paused":
//               console.log("Upload is paused");
//               break;
//             case "running":
//               console.log("Upload is running");
//               break;
//           }
//         },
//         (error) => {
//           console.error("Upload failed:", error);
//           reject(error);
//         },
//         () => {
//           getDownloadURL(uploadTask.snapshot.ref)
//             .then((downloadUrl) => {
//               console.log("File available at:", downloadUrl);
//               resolve(downloadUrl);
//             })
//             .catch((error) => reject(error));
//         }
//       );
//     } catch (error) {
//       console.error("Unexpected upload error:", error);
//       reject(error);
//     }
//   });
// }



// // lib/cloudinary.ts
// export async function uploadFile(
//   file: File,
//   setProgress?: (progress: number) => void
// ): Promise<string> {
//   try {
//     const formData = new FormData();
//     formData.append("file", file);
//     formData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!);

//     const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
//     if (!cloudName) throw new Error("Cloudinary Cloud Name not set.");

//     const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
//       method: "POST",
//       body: formData,
//     });

//     if (!response.ok) {
//       throw new Error(`Cloudinary upload failed: ${response.statusText}`);
//     }

//     const data = await response.json();
//     // Cloudinary doesn’t provide live progress updates, so setProgress to 100 manually
//     if (setProgress) setProgress(100);
//     return data.secure_url as string;
//   } catch (error) {
//     console.error("Cloudinary Upload Error:", error);
//     throw error;
//   }
// }



// lib/cloudinary.ts
export async function uploadFile(
  file: File,
  setProgress?: (progress: number) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
      const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

      if (!cloudName || !uploadPreset) {
        throw new Error("Cloudinary environment variables are missing.");
      }

      const url = `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`;

      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", uploadPreset);

      const xhr = new XMLHttpRequest();

      // 🔹 Track progress in real-time
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && setProgress) {
          const percent = Math.round((event.loaded / event.total) * 100);
          setProgress(percent);
        }
      };

      xhr.onload = () => {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          resolve(response.secure_url);
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      };

      xhr.onerror = () => {
        reject(new Error("Upload failed due to a network error."));
      };

      xhr.open("POST", url, true);
      xhr.send(formData);
    } catch (error) {
      console.error("Cloudinary upload error:", error);
      reject(error);
    }
  });
}
