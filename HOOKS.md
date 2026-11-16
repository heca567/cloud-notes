# Hooks de React utilizados

Este documento recoge los hooks que se invocan en el proyecto, tanto los
integrados de React como los hooks propios y el hook de Tiptap. Se distingue
entre los hooks de React y los de otras librerías.

## Hooks integrados de React

| Hook | Para qué se utiliza | Entidades implicadas en el proyecto | Dónde |
| --- | --- | --- | --- |
| `useCallback` | Mantiene estables las referencias a funciones de acciones y manejadores entre renderizados, según sus dependencias. | Acciones de `UserProfile`, `Note`, `Folder` y del editor. | [useAuth](src/features/auth/useAuth.ts), [useNote](src/features/notes/data/useNote.ts), [useNotes (datos)](src/features/notes/data/useNotes.ts), [useFolder](src/features/folders/data/useFolder.ts), [useEditor](src/features/editor/useEditor.ts) |
| `useContext` | Lee el contexto de notas o el contexto de autenticación sin pasar sus valores manualmente por cada componente. | `Note`, `Folder`, `UIState` y `SessionContext`. | [NotesContext](src/context/NotesContext.tsx), [auth/auth](auth/auth.tsx) |
| `useEffect` | Sincroniza el componente con suscripciones de autenticación y datos, cambios de red y otros efectos; también permite limpiar suscripciones y listeners al desmontarse. | `UserProfile`, `Note`, `Folder`, estado de red y listeners de interfaz. | [App](src/App.tsx), [NotesContext](src/context/NotesContext.tsx), [FolderModal](src/components/FolderModal.tsx), [useAuth](src/features/auth/useAuth.ts), [useNotes (datos)](src/features/notes/data/useNotes.ts), [useFolder](src/features/folders/data/useFolder.ts), [auth/auth](auth/auth.tsx) |
| `useReducer` | Gestiona estados complejos mediante reducers: el estado global de la interfaz y el estado de la interfaz del editor. | `UIState` y estado del editor. | [NotesContext](src/context/NotesContext.tsx), [useEditor](src/features/editor/useEditor.ts) |
| `useRef` | Conserva referencias mutables entre renderizados para temporizadores, guardados pendientes y manejadores del editor. | Instancia `Editor`, guardado pendiente de `Note` y temporizadores. | [useEditor](src/features/editor/useEditor.ts) |
| `useState` | Gestiona estado local de componentes y datos como carpetas, notas, título, estadísticas y estado de modales. | `Note`, `Folder`, `SessionContext` y estado local de interfaz/editor. | [componentes](src/components/), [NotesContext](src/context/NotesContext.tsx), [useNotes (datos)](src/features/notes/data/useNotes.ts), [useEditor](src/features/editor/useEditor.ts), [auth/auth](auth/auth.tsx) |
| `useTransition` | Marca como transición de menor prioridad la actualización de la interfaz al recibir las notas y expone `isPending`. | Lista de `Note` y estado de carga de la transición. | [useNotes (datos)](src/features/notes/data/useNotes.ts) |

## Hooks propios del proyecto

| Hook | Responsabilidad | Entidades que maneja | Archivo |
| --- | --- | --- | --- |
| `useNotes` (contexto) | Lee el contexto compartido de notas y acciones; lanza un error si se usa fuera de `NotesProvider`. | `Note`, `Folder`, usuario autenticado y estado de interfaz (`UIState`). | [NotesContext](src/context/NotesContext.tsx) |
| `useNotes` (datos) | Se suscribe a las notas del repositorio y expone su estado y acciones de creación y gestión. En el contexto se importa como `useNotesData`. | `Note`, `UserProfile` y estado de sincronización de notas. | [useNotes](src/features/notes/data/useNotes.ts) |
| `useAuth` (feature) | Se suscribe al estado de autenticación del repositorio y expone las acciones de iniciar y cerrar sesión. | `UserProfile` y estado de autenticación. | [useAuth](src/features/auth/useAuth.ts) |
| `useAuth` (contexto heredado) | Lee `AuthContext` y expone la sesión y sus acciones; requiere `AuthProvider`. Lo usa `Sidebar`. | `SessionContext` y acciones de sesión. | [auth/auth](auth/auth.tsx), [Sidebar](src/components/Sidebar.tsx) |
| `useNote` | Expone acciones para actualizar, eliminar, restaurar, fijar y mover notas. | `Note` y acciones/estado de la interfaz asociados a notas (`UIAction`). | [useNote](src/features/notes/data/useNote.ts) |
| `useFolder` | Se suscribe a las carpetas y expone acciones para crearlas, actualizarlas y eliminarlas. | `Folder`; también gestiona `Note` al moverlas o archivarlas al eliminar una carpeta. | [useFolder](src/features/folders/data/useFolder.ts) |
| `useEditor` | Coordina el estado, los comandos, los formatos y el guardado del editor de notas. | `Note`, instancia `Editor` de Tiptap y estado del editor (formatos, estadísticas y menús). | [useEditor](src/features/editor/useEditor.ts) |

Los nombres `useNotes` y `useAuth` aparecen en dos implementaciones distintas;
la tabla especifica cuál es cuál.

## Hook de otra librería

`useTiptapEditor` es el hook `useEditor` de `@tiptap/react`, importado con un
alias en [useEditor](src/features/editor/useEditor.ts). Inicializa y conecta
la instancia `Editor`, que presenta y modifica el contenido de `Note`; no es
un hook integrado de React.
