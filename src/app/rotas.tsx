import { createBrowserRouter } from 'react-router-dom'
import { Layout } from './Layout'
import { Inicio } from './paginas/Inicio'
import { PaginaTrilha } from './paginas/PaginaTrilha'
import { PaginaLicao } from './paginas/PaginaLicao'
import { NaoEncontrado } from './paginas/NaoEncontrado'
import { PaginaConta } from './paginas/PaginaConta'

/**
 * Rotas em português — cada lição tem endereço próprio, para poder ser
 * compartilhada por WhatsApp e retomada de onde parou (PLANEJAMENTO.md §6.3).
 */
export const rotas = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    errorElement: <NaoEncontrado />,
    children: [
      { index: true, element: <Inicio /> },
      { path: 'entrar', element: <PaginaConta modo="entrar" /> },
      { path: 'criar-conta', element: <PaginaConta modo="criar" /> },
      { path: 'trilha/:idTrilha', element: <PaginaTrilha /> },
      { path: 'trilha/:idTrilha/licao/:idLicao', element: <PaginaLicao /> },
      { path: '*', element: <NaoEncontrado /> },
    ],
  },
])
