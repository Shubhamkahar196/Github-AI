// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries
import {getDownloadURL, getStorage, uploadBytesResumable} from 'firebase/storage'

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD7_7weyjaM7Gsp47BtexxASRoL_57NIEM",
  authDomain: "github-ai-4d329.firebaseapp.com",
  projectId: "github-ai-4d329",
  storageBucket: "github-ai-4d329.firebasestorage.app",
  messagingSenderId: "760960591477",
  appId: "1:760960591477:web:c5320b855c2f6a4d7cba3c"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const storage = getStorage(app)


export async function uploadFile(file: File, setProgress?: (progress: number)=> void){
    return new Promise((resolve,reject) =>{
        try {
            const storageRef = ref(storage, file.name)
            const uploadTask = uploadBytesResumable(storageRef,file)

            uploadTask.on('state_changed',snapshot =>{
                const progress = Math.round((snapshot.bytesTransferred /snapshot.totalBytes) * 100)
                if(setProgress) setProgress(progress)
                    switch(snapshot.state){
                case 'paused':
                    console.log('upload is paused'); break;
                    case 'running':
                        console.log('upload is running'); break;
            }
            },error =>{
                reject(error)
            }, () =>{
                getDownloadURL(uploadTask.snapshot.ref).then(downloadUrl => {
                    resolve(downloadUrl)
                })
            })
        } catch (error) {
            console.error(error)
            reject(error)
        }
    })
}