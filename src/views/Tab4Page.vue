<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Órdenes</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <ion-refresher slot="fixed" @ionRefresh="actualizar($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <!-- Sin token: pedimos inicio de sesión -->
      <div v-if="!token" class="ion-padding" style="max-width: 480px; margin: 0 auto">
        <h2>Iniciar sesión</h2>
        <p>Para ver las órdenes necesitas una cuenta.</p>

        <form @submit.prevent="iniciarSesion">
          <ion-item>
            <ion-input
              v-model="credenciales.email"
              type="email"
              label="Correo"
              placeholder="admin@example.com"
              required
            ></ion-input>
          </ion-item>

          <ion-item>
            <ion-input
              v-model="credenciales.password"
              type="password"
              label="Contraseña"
              placeholder="password"
              required
            ></ion-input>
          </ion-item>

          <ion-button type="submit" expand="block" :disabled="cargando">
            {{ cargando ? 'Entrando...' : 'Entrar' }}
          </ion-button>
        </form>
      </div>

      <!-- Con token: mostramos las órdenes -->
      <div v-else>
        <ion-list>
          <ion-item v-for="orden in ordenes" :key="orden.id">
            <ion-label>
              <h2>{{ orden.numero_orden }}</h2>
              <p>Cliente: {{ orden.customer.name }}</p>
              <p>Total: {{ formatear(orden.total) }} · IVA: {{ formatear(orden.iva) }}</p>
            </ion-label>
          </ion-item>
        </ion-list>

        <p v-if="ordenes.length === 0 && !cargando" class="ion-padding">
          No hay órdenes para mostrar.
        </p>

        <div class="ion-padding">
          <ion-button
            v-if="quedanMasPaginas"
            expand="block"
            fill="clear"
            :disabled="cargando"
            @click="cargarMas"
          >
            Cargar más
          </ion-button>

          <ion-button expand="block" fill="clear" @click="cerrarSesion">
            Cerrar sesión
          </ion-button>
        </div>
      </div>

      <ion-text v-if="error" color="danger" class="ion-padding">
        <p>{{ error }}</p>
      </ion-text>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonRefresher,
  IonRefresherContent,
  IonList,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonText,
} from '@ionic/vue';
import type { RefresherCustomEvent } from '@ionic/vue';
import { computed, ref } from 'vue';
import type { Orders } from '@/interfaces/orders';
import { ApiError, getOrders, getToken, login, removeToken, setToken } from '@/services/api';

// Si ya hay un token guardado, la app entra directo a las órdenes
const token = ref<string | null>(getToken());
const ordenes = ref<Orders[]>([]);
const credenciales = ref({ email: '', password: '' });
const cargando = ref(false);
const error = ref('');
const paginaActual = ref(1);
const ultimaPagina = ref(1);

const quedanMasPaginas = computed(() => paginaActual.value < ultimaPagina.value);

const formatoMoneda = new Intl.NumberFormat('es-HN', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function formatear(numero: number): string {
  return formatoMoneda.format(numero);
}

async function iniciarSesion() {
  if (!credenciales.value.email || !credenciales.value.password) {
    error.value = 'Escribe tu correo y contraseña.';
    return;
  }

  cargando.value = true;
  error.value = '';

  try {
    // 1. La API valida las credenciales y devuelve un bearer token
    const nuevoToken = await login(credenciales.value.email, credenciales.value.password);

    // 2. Guardamos el token para usarlo en las siguientes peticiones
    setToken(nuevoToken);
    token.value = nuevoToken;

    // 3. Cargamos las órdenes
    await cargarOrdenes();
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Ocurrió un error inesperado';
  } finally {
    cargando.value = false;
  }
}

async function cargarOrdenes() {
  if (!token.value) return;

  cargando.value = true;
  error.value = '';

  try {
    const respuesta = await getOrders(token.value, paginaActual.value);

    // En la primera página reemplazamos la lista; en las siguientes, agregamos
    ordenes.value =
      paginaActual.value === 1 ? respuesta.data : [...ordenes.value, ...respuesta.data];

    ultimaPagina.value = respuesta.meta.last_page;
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Ocurrió un error inesperado';

    // Si el token ya no es válido, volvemos al formulario de inicio de sesión
    if (e instanceof ApiError && e.status === 401) {
      removeToken();
      token.value = null;
      ordenes.value = [];
    }
  } finally {
    cargando.value = false;
  }
}

// Pull-to-refresh: vuelve a la primera página
async function actualizar(evento: RefresherCustomEvent) {
  paginaActual.value = 1;
  await cargarOrdenes();
  evento.detail.complete();
}

async function cargarMas() {
  if (quedanMasPaginas.value) {
    paginaActual.value += 1;
    await cargarOrdenes();
  }
}

function cerrarSesion() {
  removeToken();
  token.value = null;
  ordenes.value = [];
  credenciales.value = { email: '', password: '' };
  paginaActual.value = 1;
  ultimaPagina.value = 1;
  error.value = '';
}

// Si la página se abre con un token guardado, cargamos las órdenes de una vez
if (token.value) {
  cargarOrdenes();
}
</script>
