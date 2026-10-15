import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { rotas } from '@/app/rotas'
import { carregarProgresso } from '@/progresso/store'
import { useConta } from '@/conta/store'
import { ligarSincroniaAutomatica } from '@/conta/sincronia'
import './design/tokens.css'

const elemento = document.getElementById('raiz')
if (!elemento) throw new Error('elemento #raiz não encontrado')

// O progresso vem do IndexedDB antes da primeira pintura, para a tela inicial
// não piscar "0 XP" e depois corrigir.
await carregarProgresso()

// A conta é opcional: o app pinta primeiro e descobre depois se há sessão
// aberta. Esperar pela rede aqui atrasaria a primeira tela à toa.
ligarSincroniaAutomatica()
void useConta.getState().iniciar()

createRoot(elemento).render(
  <StrictMode>
    <RouterProvider router={rotas} />
  </StrictMode>,
)
