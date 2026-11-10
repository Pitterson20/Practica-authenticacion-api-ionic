<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Crear Posts</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">Tab 3</ion-title>
        </ion-toolbar>
      </ion-header>

      <form @submit.prevent="guardarPost">
        <ion-item>
          <ion-input placeholder="Titulo" v-model="form.name" label="Titulo"></ion-input>
        </ion-item>
         <ion-item>
          <ion-input placeholder="Body" v-model="form.body" label="Body"></ion-input>
        </ion-item>
         <ion-item>
         <ion-select placeholder="Select One" v-model="form.userId" label="Usuario" ref="selectUser">
            <ion-select-option :value="usuario.id" v-for="usuario in usuarios" :key="usuario.id">
              {{ usuario.name }}
            </ion-select-option>
          
          </ion-select>
        </ion-item>
      
          <ion-button type="submit" expand="block" color="primary">Enviar</ion-button>
          <ion-button expand="block" color="secondary" @click="escanearQR">Escanear QR</ion-button>
          

      </form>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { Usuarios } from '@/interfaces/usuarios';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonInput, IonSelect, IonSelectOption, IonItem, IonButton } from '@ionic/vue';
import { ref } from 'vue';
import { CapacitorBarcodeScanner, CapacitorBarcodeScannerOptions, CapacitorBarcodeScannerTypeHint } from '@capacitor/barcode-scanner';

const { scanBarcode  } = CapacitorBarcodeScanner;
const options: CapacitorBarcodeScannerOptions = {
  hint: CapacitorBarcodeScannerTypeHint.QR_CODE,
};
const form = ref({
  name: '',
  body: '',
  userId: 0
});


const usuarios = ref<Usuarios[]>([]);

function escanearQR(){
  scanBarcode(options).then((data) =>{
    console.log(data);

    // "Title: Probando Ionic y capacitor\nBody: una prueba de ionic y capacitor\nUser: 1"

    form.value.name = data.ScanResult.split('\n')[0].split(': ')[1];
    form.value.body = data.ScanResult.split('\n')[1].split(': ')[1];
    form.value.userId = parseInt(data.ScanResult.split('\n')[2].split(': ')[1]);
    
    
  }).catch((error) => {
    console.error('Error al escanear el código QR:', error);
  });
}

function guardarPost(){
 fetch('https://jsonplaceholder.typicode.com/posts', {
  method: 'POST',
  body: JSON.stringify({
    title: form.value.name,
    body: form.value.body,
    userId: form.value.userId,
  }),
  headers: {
    'Content-type': 'application/json; charset=UTF-8',
  },
})
  .then(response => response.json())
  .then(json => console.log(json))
}

function cargarUsuarios(){

  fetch('https://jsonplaceholder.typicode.com/users')
  .then(response => response.json())
  .then(json => {
    console.log(json);
    usuarios.value = json;

  })

}
cargarUsuarios();
</script>
