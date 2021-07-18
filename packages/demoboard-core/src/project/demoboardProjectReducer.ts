// @ts-nocheck
/*
 * Copyright 2019 Seven Stripes Kabushiki Kaisha
 *
 * This source code is licensed under the Apache License, Version 2.0, found
 * in the LICENSE file in the root directory of this source tree.
 */

import { applyChanges, change, Text, Proxy } from 'automerge'
import {
  EditorChange as CodeMirrorChange,
  Doc as CodeMirrorDoc,
} from 'codemirror'
import {
  DemoboardPanelType,
  DemoboardProjectState,
  DemoboardProjectAction,
  DemoboardGeneratedFile,
  DemoboardProjectView,
  DemoboardProjectData,
} from '../types'
import {
  go,
  getCurrentLocation,
  createHistoryLocation,
  pushLocation,
} from '../utils/history'

function updateView(
  state: DemoboardProjectState,
  callback: (value: Proxy<DemoboardProjectView>) => void,
): DemoboardProjectState<any> {
  let commitMessage = Date.now()
  return {
    ...state,
    view: change(state.view, String(commitMessage), callback),
  }
}

function updateData(
  state: DemoboardProjectState,
  callback: (value: Proxy<DemoboardProjectData>) => void,
): DemoboardProjectState<any> {
  let commitMessage = Date.now()
  return {
    ...state,
    data: change(state.data, String(commitMessage), callback),
  }
}

function closeTab(state: DemoboardProjectState, pathname: string) {

  let selectedPathnameIndex = state.view.selectedTab
    ? state.view.tabs.indexOf(state.view.selectedTab)
    : -1

  let tabs = state.view.tabs

  tabs = tabs.splice(selectedPathnameIndex, selectedPathnameIndex)

  var selectedTab: string;


    let newSelectedTabIndex = Math.min(
      selectedPathnameIndex,
      tabs.length - 1,
    )
    selectedTab =
      newSelectedTabIndex === -1 ? null : tabs[newSelectedTabIndex]


  console.log("72 selectedTab ", selectedTab)

  return {
    ...state,
    view: {
      ...state.view,
      tabs: tabs,
      selectedTab: selectedTab
    }
  }


  // console.log("51 closeTab state", state)
  // console.log("52 closeTab pathname", pathname)
  // return updateView(state, view => {
  //   let selectedPathnameIndex = state.view.selectedTab
  //     ? view.tabs.indexOf(state.view.selectedTab)
  //     : -1
  //
  //   view.tabs.splice(selectedPathnameIndex, selectedPathnameIndex)
  //
  //   // If we just removed the selected tab, then let's try and select
  //   // another tab
  //   if (pathname && view.tabs.indexOf(pathname) === -1) {
  //     let newSelectedTabIndex = Math.min(
  //       selectedPathnameIndex,
  //       view.tabs.length - 1,
  //     )
  //     view.selectedTab =
  //       newSelectedTabIndex === -1 ? null : view.tabs[newSelectedTabIndex]
  //   }
  // })
}

function openTab(state: DemoboardProjectState, pathname: string) {

  return {
    ...state,
    view: {
      ...state.view,
      tabs: [...state.view.tabs, pathname],
      selectedTab:  pathname
    }
  }

  // return updateView(state, view => {
  //   if (view.tabs.indexOf(pathname) === -1) {
  //     let selectedPathnameIndex = state.view.selectedTab
  //       ? view.tabs.indexOf(state.view.selectedTab)
  //       : -1
  //     view.tabs.splice(selectedPathnameIndex + 1, 0, pathname)
  //   }
  //   view.selectedTab = pathname
  // })
}

function selectTab(state: DemoboardProjectState, pathname: string | null) {
  return {
    ...state,
    view: {
      ...state.view,
      selectedTab: pathname,
    }
  }
  // return updateView(state, view => {
  //   view.selectedTab = pathname
  // })
}

function setTabs(
  state: DemoboardProjectState,
  pathnames: string[],
  selectedPathname?: string | null,
) {
  return updateView(state, view => {
    let previouslySelectedTab = view.selectedTab
    let selectedPathnameIndex =
      (view.selectedTab !== null && view.tabs.indexOf(view.selectedTab)) || -1

    view.tabs = pathnames

    if (selectedPathname !== undefined) {
      view.selectedTab = selectedPathname
    }
    // If we just removed the selected tab, then let's try and select
    // another tab near the same index
    else if (
      previouslySelectedTab &&
      view.tabs.indexOf(previouslySelectedTab) === -1
    ) {
      let newSelectedTabIndex = Math.min(
        selectedPathnameIndex,
        view.tabs.length - 1,
      )
      view.selectedTab =
        newSelectedTabIndex === -1 ? null : view.tabs[newSelectedTabIndex]
    }
  })
}

function changeSource(
  state: DemoboardProjectState,
  value: string,
  pathname: string,
  codeMirrorDoc: CodeMirrorDoc,
  codeMirrorChanges: CodeMirrorChange[] = [],
) {
  console.log("178 changeSource ", state)
  console.log("179 changeSource ", value)
  console.log("179 changeSource ", pathname)
  console.log("180 changeSource ", codeMirrorDoc)
  console.log("181 changeSource ", codeMirrorChanges)

  console.log("128 ", state.data.sources[pathname])
  let source = state.data.sources[pathname]
  console.log("130 ", state.data.sources[pathname])

  // if (!(source instanceof Text)) {
    if (codeMirrorDoc && source) {
      return replaceSources(
        state,
        {
          [pathname]: {
            source: codeMirrorDoc.getValue().toString(),
            codeMirrorDoc,
          },
        },
        {
          merge: true,
        },
      )
    } else {
      throw new Error(
        'Invariant violation: cannot change a generated source without passing in a codeMirrorDoc and a generator',
      )
    }
  // }

  // if (codeMirrorChanges.length === 0) {
  //   return state
  // }
  //
  // return {
  //   ...updateData(state, data => {
  //     console.log("159 pathname", pathname)
  //     console.log("159 ", data.sources[pathname])
  //     const text = data.sources[pathname] as Text
  //     console.log("161 ", data.sources[pathname], ":more: ", text)
  //
  //     console.log("214 codeMirrorChanges ", codeMirrorChanges)
  //
  //     for (let change of codeMirrorChanges) {
  //       const startPos = codeMirrorDoc.indexFromPos(change.from)
  //       const removedLines = change.removed || ['']
  //       const addedLines = change.text
  //       const removedLength =
  //         removedLines.reduce(
  //           (sum, remove) => sum + Array.from(remove).length + 1,
  //           0,
  //         ) - 1
  //
  //       if (removedLength > 0) {
  //         text.deleteAt!(startPos, removedLength)
  //       }
  //
  //       const addedText = addedLines.join('\n')
  //       if (addedText.length > 0) {
  //         text.insertAt!(startPos, ...Array.from(addedText))
  //       }
  //     }
  //   }),
  //   unpersistedCodeMirrorDocs: {
  //     ...state.unpersistedCodeMirrorDocs,
  //     [pathname]: codeMirrorDoc,
  //   },
  // }


  console.log("250 reached changeSource end ")

  return {
    ...state,
    data: {
      ...state.data,
      sources: {
        [pathname]: codeMirrorDoc.getValue().toString(),
      }
    },
    unpersistedCodeMirrorDocs: {
      ...state.unpersistedCodeMirrorDocs,
      [pathname]: codeMirrorDoc,
    },
  }
}

function deleteSource(state: DemoboardProjectState, pathname: string) {
  // pathname = "/styles.css"
  console.log("185 state", state)
  console.log("186 pathname", pathname)
  let unpersistedCodeMirrorDocs = state.unpersistedCodeMirrorDocs
  console.log("188 unpersistedCodeMirrorDocs", unpersistedCodeMirrorDocs)
  if (pathname in unpersistedCodeMirrorDocs) {
    // unpersistedCodeMirrorDocs = { ...unpersistedCodeMirrorDocs }
    delete unpersistedCodeMirrorDocs[pathname]
  }
  console.log("201 unpersistedCodeMirrorDocs", unpersistedCodeMirrorDocs)
  console.log("202 state.unpersistedCodeMirrorDocs", state.unpersistedCodeMirrorDocs)
  return {
    ...updateData(state, data => {

      console.log("206 state ", state)

      let sources = state.data.sources
      console.log("207 sources", sources)

      if (pathname in sources) {
        console.log("212 sources", sources)
        let mySource = sources[pathname]
        console.log("213 sources", mySource)
        // @ts-ignore
        // sources[pathname] = ""
        console.log("216 sources", sources[pathname])
        // @ts-ignore
        delete sources[pathname]
      }

      // console.log("274 ", state.view.selectedTab)
      // selectTab(state, "/index.js")
      // console.log("275 ", state.view.selectedTab)

      // console.log("197 all ", data)
      // console.log("198 state ", state)
      // console.log("199 deleteSource ", data.sources)
      // console.log("200 deleteSource ", data.sources[pathname])
      // // delete data.sources[pathname]
      // console.log("209 deleteSource ", data.sources[pathname])
      // console.log("210 state ", state)
      //
      // console.log("212 ", state.unpersistedCodeMirrorDocs)
      // console.log("213 ", unpersistedCodeMirrorDocs)
    }),
    unpersistedCodeMirrorDocs,
  }
}

function replaceSources(
  state: DemoboardProjectState,
  files: {
    [pathname: string]: {
      /**
       * If a generated file is supplied, then this will become a
       * generated file instead of a standard source.
       */
      source: string | DemoboardGeneratedFile
      codeMirrorDoc?: CodeMirrorDoc
    }
  },
  { merge = false }: { merge: boolean },
) {
  let entries = Object.entries(files)
  if (entries.length === 0) {
    return state
  }

  let unpersistedCodeMirrorDocs = { ...state.unpersistedCodeMirrorDocs }
  return {
    ...updateData(state, data => {
      for (let [pathname, { source, codeMirrorDoc }] of Object.entries(files)) {
        if (codeMirrorDoc) {
          unpersistedCodeMirrorDocs[pathname] = codeMirrorDoc
        }

        if (!merge) {
          console.log("235 ", data.sources)
          data.sources = {}
          console.log("237 ", data.sources)
        }

        if (typeof source !== 'string') {
          console.log("241 ", data.sources[pathname])
          data.sources[pathname] = source
          console.log("243 ", data.sources[pathname])
        } else {
          let text = new Text()
          if (source.length) {
            text.insertAt!(0, ...source)
          }
          console.log("249 ", data.sources[pathname])
          data.sources[pathname] = text
          console.log("251 ", data.sources[pathname])
        }
      }
    }),
    ...(merge
      ? state.view
      : updateView(state, view => {
          let pathnames = Object.keys(files)
          let originalTabs = view.tabs
          let originalSelectedTab = view.selectedTab
          let originalSelectedTabIndex =
            (originalSelectedTab &&
              originalTabs.indexOf(originalSelectedTab)) ||
            -1

          // Remove any tabs which are no longer available
          view.tabs = originalTabs.filter(tab => pathnames.indexOf(tab) !== -1)

          // If the selected tab has disappeared, select one as close to the
          // original index as possible
          if (
            originalSelectedTab !== null &&
            pathnames.indexOf(originalSelectedTab) === -1
          ) {
            let newSelectedTabIndex = Math.min(
              originalSelectedTabIndex,
              view.tabs.length - 1,
            )
            view.selectedTab =
              newSelectedTabIndex === -1 ? null : view.tabs[newSelectedTabIndex]
          }
        })),
    unpersistedCodeMirrorDocs,
  }

  // var pathname: string
  // var source
  // var codeMirrorDoc
  // for (let [pathname, { source, codeMirrorDoc }] of Object.entries(files)) {
  //   pathname = pathname
  //   source = source
  //   codeMirrorDoc = codeMirrorDoc
  // }
  //
  // console.log("396 pathname ", pathname)
  // console.log("397 source ", source)
  // console.log("398 codeMirrorDoc ", codeMirrorDoc)
  // console.log("399 merge ", merge)
  // return {
  //   ...state,
  //   data: {
  //     ...state.data,
  //     sources: {
  //       [pathname]: source,
  //     }
  //   },
  //   unpersistedCodeMirrorDocs: {
  //     ...state.unpersistedCodeMirrorDocs,
  //     [pathname]: codeMirrorDoc,
  //   },
  // }
}

export default function demoboardProjectReducer<
  PanelType extends DemoboardPanelType = DemoboardPanelType
>(
  state: DemoboardProjectState<PanelType>,
  action: DemoboardProjectAction<PanelType>,
): DemoboardProjectState<PanelType> {
  switch (action.type) {
    case 'reset':
      return action.state

    // case 'data.applyChanges':
    //   return {
    //     ...state,
    //     data: applyChanges(state.data, action.changes),
    //   }
    //
    // case 'data.replace':
    //   return {
    //     ...state,
    //     data: action.data,
    //   }

    case 'tabs.close':
      return closeTab(state, state.view.selectedTab || action.pathname)

    // case 'tabs.open':
    //   return openTab(state, action.pathname)

    case 'tabs.select':
      return selectTab(state, action.pathname)

    // case 'tabs.set':
    //   return setTabs(state, action.pathnames, action.selectedPathname)

    case 'sources.create':
      return openTab(
        replaceSources(
          state,
          {
            [action.pathname]: {
              source: action.source,
              codeMirrorDoc: action.codeMirrorDoc,
            },
          },
          {
            merge: true,
          },
        ),
        action.pathname,
      )

    case 'sources.change':
      return changeSource(
        state,
        action.value,
        action.pathname,
        action.codeMirrorDoc,
        action.codeMirrorChanges,
      )

    case 'sources.delete':
      return deleteSource(closeTab(state, action.pathname), action.pathname)

    // case 'sources.merge':
    //   return replaceSources(state, action.files, {
    //     merge: true,
    //   })

    // case 'sources.replace':
    //   return replaceSources(state, action.files, {
    //     merge: false,
    //   })

    // case 'activeTemplate.set':
    //   return updateView(state, view => {
    //     view.activeTemplate = action.activeTemplate
    //   })
    //
    // case 'dependencies.set':
    //   return updateData(state, data => {
    //     Object.assign(data.dependencies, action.dependencies)
    //   })
    //
    // case 'metadata.set':
    //   return updateData(state, data => {
    //     for (let existingKey of Object.keys(data.metadata)) {
    //       if (!(existingKey in data.metadata)) {
    //         delete data.metadata[existingKey]
    //       }
    //     }
    //     for (let key of Object.keys(action.metadata)) {
    //       data.metadata[key] = new Text()
    //       data.metadata[key].insertAt!(0, ...action.metadata[key])
    //     }
    //   })
    //
    // case 'panels.deprioritize':
    //   return updateView(state, view => {
    //     let index = view.panelPriorityOrder.indexOf(action.panel)
    //     if (index !== -1) {
    //       view.panelPriorityOrder.splice(index, 1)
    //       view.panelPriorityOrder.unshift(action.panel)
    //     }
    //   })
    //
    // case 'panels.prioritize':
    //   return updateView(state, view => {
    //     let index = view.panelPriorityOrder.indexOf(action.panel)
    //     if (index !== -1) {
    //       view.panelPriorityOrder.splice(index, 1)
    //     }
    //     view.panelPriorityOrder.push(action.panel)
    //   })
    //
    // case 'panels.remove':
    //   return updateView(state, view => {
    //     let index = view.panelPriorityOrder.indexOf(action.panel)
    //     if (index !== -1) {
    //       view.panelPriorityOrder.splice(index, 1)
    //     }
    //   })

    case 'history.setLocationBar':
      return updateView(state, view => {
        view.locationBar = action.value
      })

    case 'history.traverse':
      return updateView(state, view => {
        let newHistory = go(view.history, action.count)
        view.history = newHistory
        view.locationBar = getCurrentLocation(newHistory).uri
      })

    case 'history.go':
      return updateView(state, view => {
        let url = action.url || view.locationBar || '/'
        if (url.indexOf('//') === -1 && url[0] !== '/') {
          url = '/' + url
        }

        const location = createHistoryLocation(url, false)
        const history = view.history

        view.history = pushLocation(history, location)
        view.locationBar = location.uri
      })

    case 'history.refresh':
      return updateView(state, view => {
        const history = view.history
        const location = history.locations[history.index]
        if (location.skipRender) {
          location.skipRender = false
        }
        location.refreshCount++
      })

    case 'history.set':
      return updateView(state, view => {
        view.history = action.history
        view.locationBar = getCurrentLocation(action.history).uri
      })

    default:
      return state
  }
}
