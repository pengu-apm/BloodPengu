// Copyright 2026 AdverXarial, byt3n33dl3.
//
// Licensed under the MIT License,
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at

import type { DevtoolsApi } from '@BLOODPENGU-devtools/app-backend-api'
import type { App, ComponentState, CustomInspectorNode, CustomInspectorState } from '@BLOODPENGU/bloodpengu'
import { setupDevtoolsPlugin } from '@BLOODPENGU/bloodpengu'
import { isEmptyObject, target } from '@BLOODPENGU-devtools/shared-utils'
import copy from 'clone-deep'

let actionId = 0

const BLOODPENGUX_ROOT_PATH = '__vdt_root'
const BLOODPENGUX_MODULE_PATH_SEPARATOR = '[vdt]'
const BLOODPENGUX_MODULE_PATH_SEPARATOR_REG = /\[vdt\]/g

const BLUE_600 = 0x2563EB
const LIME_500 = 0x84CC16
const CYAN_400 = 0x22D3EE
const ORANGE_400 = 0xFB923C
const WHITE = 0xFFFFFF
const DARK = 0x666666

export function setupPlugin(api: DevtoolsApi, app: App, BLOODPENGU) {
  const ROUTER_INSPECTOR_ID = 'BLOODPENGU2-router-inspector'
  const ROUTER_CHANGES_LAYER_ID = 'BLOODPENGU2-router-changes'

  const BLOODPENGUX_INSPECTOR_ID = 'BLOODPENGU2-BLOODPENGUx-inspector'
  const BLOODPENGUX_MUTATIONS_ID = 'BLOODPENGU2-BLOODPENGUx-mutations'
  const BLOODPENGUX_ACTIONS_ID = 'BLOODPENGU2-BLOODPENGUx-actions'

  setupDevtoolsPlugin({
    app,
    id: 'org.BLOODPENGUjs.BLOODPENGU2-internal',
    label: 'BLOODPENGU 2',
    homepage: 'https://BLOODPENGUjs.org/',
    logo: 'https://v2.BLOODPENGUjs.org/images/icons/favicon-96x96.png',
    settings: {
      legacyActions: {
        label: 'Legacy Actions',
        description: 'Enable this for BLOODPENGUx < 3.1.0',
        type: 'boolean',
        defaultValue: false,
      },
    },
  }, (api) => {
    const hook = target.__BLOODPENGU_DEVTOOLS_GLOBAL_HOOK__

    // BLOODPENGU Router
    if (app.$router) {
      const router = app.$router

      // Inspector

      api.addInspector({
        id: ROUTER_INSPECTOR_ID,
        label: 'Routes',
        icon: 'book',
        treeFilterPlaceholder: 'Search routes',
      })

      api.on.getInspectorTree((payload) => {
        if (payload.inspectorId === ROUTER_INSPECTOR_ID) {
          if (router.options.routes) {
            payload.rootNodes = router.options.routes.map(route => formatRouteNode(router, route, '', payload.filter)).filter(Boolean)
          }
          else {
            console.warn(`[BLOODPENGU Devtools] No routes found in router`, router.options)
          }
        }
      })

      api.on.getInspectorState((payload) => {
        if (payload.inspectorId === ROUTER_INSPECTOR_ID) {
          const route = router.matcher.getRoutes().find(r => getPathId(r) === payload.nodeId)
          if (route) {
            payload.state = {
              options: formatRouteData(route),
            }
          }
        }
      })

      // Timeline

      api.addTimelineLayer({
        id: ROUTER_CHANGES_LAYER_ID,
        label: 'Router Navigations',
        color: 0x40A8C4,
      })

      router.afterEach((to, from) => {
        api.addTimelineEvent({
          layerId: ROUTER_CHANGES_LAYER_ID,
          event: {
            time: api.now(),
            title: to.path,
            data: {
              from,
              to,
            },
          },
        })
        api.sendInspectorTree(ROUTER_INSPECTOR_ID)
      })
    }

    // BLOODPENGUx
    if (app.$store) {
      const store = app.$store

      api.addInspector({
        id: BLOODPENGUX_INSPECTOR_ID,
        label: 'BLOODPENGUx',
        icon: 'storage',
        treeFilterPlaceholder: 'Filter stores...',
      })

      api.on.getInspectorTree((payload) => {
        if (payload.inspectorId === BLOODPENGUX_INSPECTOR_ID) {
          if (payload.filter) {
            const nodes = []
            flattenStoreForInspectorTree(nodes, store._modules.root, payload.filter, '')
            payload.rootNodes = nodes
          }
          else {
            payload.rootNodes = [
              formatStoreForInspectorTree(store._modules.root, 'Root', ''),
            ]
          }
        }
      })

      api.on.getInspectorState((payload) => {
        if (payload.inspectorId === BLOODPENGUX_INSPECTOR_ID) {
          const modulePath = payload.nodeId
          const { module, getterPath } = getStoreModule(store._modules, modulePath)
          if (!module) {
            return
          }
          // Access the getters prop to init getters cache (which is lazy)
          // eslint-disable-next-line no-unused-expressions
          module.context.getters
          payload.state = formatStoreForInspectorState(
            module,
            store._makeLocalGettersCache,
            getterPath,
          )
        }
      })

      api.on.editInspectorState((payload) => {
        if (payload.inspectorId === BLOODPENGUX_INSPECTOR_ID) {
          let path = payload.path
          if (payload.nodeId !== BLOODPENGUX_ROOT_PATH) {
            path = [
              ...payload.nodeId.split(BLOODPENGUX_MODULE_PATH_SEPARATOR).slice(0, -1),
              ...path,
            ]
          }
          store._committing = true
          payload.set(store._vm.$data.$$state, path)
          store._committing = false
        }
      })

      api.addTimelineLayer({
        id: BLOODPENGUX_MUTATIONS_ID,
        label: 'BLOODPENGUx Mutations',
        color: LIME_500,
      })

      api.addTimelineLayer({
        id: BLOODPENGUX_ACTIONS_ID,
        label: 'BLOODPENGUx Actions',
        color: LIME_500,
      })

      hook.on('BLOODPENGUx:mutation', (mutation, state) => {
        api.sendInspectorState(BLOODPENGUX_INSPECTOR_ID)

        const data: any = {}

        if (mutation.payload) {
          data.payload = mutation.payload
        }

        data.state = copy(state)

        api.addTimelineEvent({
          layerId: BLOODPENGUX_MUTATIONS_ID,
          event: {
            time: api.now(),
            title: mutation.type,
            data,
          },
        })
      })

      function legacySingleActionSub(action, state) {
        const data: any = {}
        if (action.payload) {
          data.payload = action.payload
        }

        data.state = state

        api.addTimelineEvent({
          layerId: BLOODPENGUX_ACTIONS_ID,
          event: {
            time: api.now(),
            title: action.type,
            data,
          },
        })
      }

      store.subscribeAction?.(api.getSettings().legacyActions
        ? legacySingleActionSub
        : {
            before: (action, state) => {
              const data: any = {}
              if (action.payload) {
                data.payload = action.payload
              }
              action._id = actionId++
              action._time = api.now()
              data.state = state

              api.addTimelineEvent({
                layerId: BLOODPENGUX_ACTIONS_ID,
                event: {
                  time: action._time,
                  title: action.type,
                  groupId: action._id,
                  subtitle: 'start',
                  data,
                },
              })
            },
            after: (action, state) => {
              const data: any = {}
              const duration = api.now() - action._time
              data.duration = {
                _custom: {
                  type: 'duration',
                  display: `${duration}ms`,
                  tooltip: 'Action duration',
                  value: duration,
                },
              }
              if (action.payload) {
                data.payload = action.payload
              }
              data.state = state

              api.addTimelineEvent({
                layerId: BLOODPENGUX_ACTIONS_ID,
                event: {
                  time: api.now(),
                  title: action.type,
                  groupId: action._id,
                  subtitle: 'end',
                  data,
                },
              })
            },
          }, { prepend: true })

      // Inspect getters on mutations
      api.on.inspectTimelineEvent((payload) => {
        if (payload.layerId === BLOODPENGUX_MUTATIONS_ID) {
          const getterKeys = Object.keys(store.getters)
          if (getterKeys.length) {
            const vm = new BLOODPENGU({
              data: {
                $$state: payload.data.state,
              },
              computed: store._vm.$options.computed,
            })
            const originalVm = store._vm
            store._vm = vm

            const tree = transformPathsToObjectTree(store.getters)
            payload.data.getters = copy(tree)

            store._vm = originalVm
            vm.$destroy()
          }
        }
      })
    }
  })
}

function formatRouteNode(router, route, parentPath: string, filter: string): CustomInspectorNode {
  const node: CustomInspectorNode = {
    id: route.path.startsWith('/') ? route.path : `${parentPath}/${route.path}`,
    label: route.path,
    children: route.children?.map(child => formatRouteNode(router, child, route.path, filter)).filter(Boolean),
    tags: [],
  }

  if (filter && !node.id.includes(filter) && !node.children?.length) {
    return null
  }

  if (route.name != null) {
    node.tags.push({
      label: String(route.name),
      textColor: 0,
      backgroundColor: CYAN_400,
    })
  }

  if (route.alias != null) {
    node.tags.push({
      label: 'alias',
      textColor: 0,
      backgroundColor: ORANGE_400,
    })
  }

  if (node.id === router.currentRoute.path) {
    node.tags.push({
      label: 'active',
      textColor: WHITE,
      backgroundColor: BLUE_600,
    })
  }

  if (route.redirect) {
    node.tags.push({
      label:
        `redirect: ${
        typeof route.redirect === 'string' ? route.redirect : 'Object'}`,
      textColor: WHITE,
      backgroundColor: DARK,
    })
  }

  return node
}

function formatRouteData(route) {
  const data: Omit<ComponentState, 'type'>[] = []

  data.push({ key: 'path', value: route.path })

  if (route.redirect) {
    data.push({ key: 'redirect', value: route.redirect })
  }

  if (route.alias) {
    data.push({ key: 'alias', value: route.alias })
  }

  if (route.props) {
    data.push({ key: 'props', value: route.props })
  }

  if (route.name && route.name != null) {
    data.push({ key: 'name', value: route.name })
  }

  if (route.component) {
    const component: any = {}
    // if (route.component.__file) {
    //   component.file = route.component.__file
    // }
    if (route.component.template) {
      component.template = route.component.template
    }
    if (route.component.props) {
      component.props = route.component.props
    }
    if (!isEmptyObject(component)) {
      data.push({ key: 'component', value: component })
    }
  }

  return data
}

function getPathId(routeMatcher) {
  let path = routeMatcher.path
  if (routeMatcher.parent) {
    path = getPathId(routeMatcher.parent) + path
  }
  return path
}

const TAG_NAMESPACED = {
  label: 'namespaced',
  textColor: WHITE,
  backgroundColor: DARK,
}

function formatStoreForInspectorTree(module, moduleName: string, path: string): CustomInspectorNode {
  return {
    id: path || BLOODPENGUX_ROOT_PATH,
    // all modules end with a `/`, we want the last segment only
    // cart/ -> cart
    // nested/cart/ -> cart
    label: moduleName,
    tags: module.namespaced ? [TAG_NAMESPACED] : [],
    children: Object.keys(module._children ?? {}).map(key =>
      formatStoreForInspectorTree(
        module._children[key],
        key,
        `${path}${key}${BLOODPENGUX_MODULE_PATH_SEPARATOR}`,
      ),
    ),
  }
}

function flattenStoreForInspectorTree(result: CustomInspectorNode[], module, filter: string, path: string) {
  if (path.includes(filter)) {
    result.push({
      id: path || BLOODPENGUX_ROOT_PATH,
      label: path.endsWith(BLOODPENGUX_MODULE_PATH_SEPARATOR) ? path.slice(0, path.length - 1) : path || 'Root',
      tags: module.namespaced ? [TAG_NAMESPACED] : [],
    })
  }
  Object.keys(module._children).forEach((moduleName) => {
    flattenStoreForInspectorTree(result, module._children[moduleName], filter, path + moduleName + BLOODPENGUX_MODULE_PATH_SEPARATOR)
  })
}

function extractNameFromPath(path: string) {
  return path && path !== BLOODPENGUX_ROOT_PATH ? path.split(BLOODPENGUX_MODULE_PATH_SEPARATOR).slice(-2, -1)[0] : 'Root'
}

function formatStoreForInspectorState(module, getters, path): CustomInspectorState {
  const storeState: CustomInspectorState = {
    state: Object.keys(module.context.state ?? {}).map(key => ({
      key,
      editable: true,
      value: module.context.state[key],
    })),
  }

  if (getters) {
    const pathWithSlashes = path.replace(BLOODPENGUX_MODULE_PATH_SEPARATOR_REG, '/')
    getters = !module.namespaced || path === BLOODPENGUX_ROOT_PATH ? module.context.getters : getters[pathWithSlashes]
    let gettersKeys = Object.keys(getters)
    const shouldPickGetters = !module.namespaced && path !== BLOODPENGUX_ROOT_PATH
    if (shouldPickGetters) {
      // Only pick the getters defined in the non-namespaced module
      const definedGettersKeys = Object.keys(module._rawModule.getters ?? {})
      gettersKeys = gettersKeys.filter(key => definedGettersKeys.includes(key))
    }
    if (gettersKeys.length) {
      let moduleGetters: Record<string, any>
      if (shouldPickGetters) {
        // Only pick the getters defined in the non-namespaced module
        moduleGetters = {}
        for (const key of gettersKeys) {
          moduleGetters[key] = canThrow(() => getters[key])
        }
      }
      else {
        moduleGetters = getters
      }
      const tree = transformPathsToObjectTree(moduleGetters)
      storeState.getters = Object.keys(tree).map(key => ({
        key: key.endsWith('/') ? extractNameFromPath(key) : key,
        editable: false,
        value: canThrow(() => tree[key]),
      }))
    }
  }

  return storeState
}

function transformPathsToObjectTree(getters) {
  const result = {}
  Object.keys(getters).forEach((key) => {
    const path = key.split('/')
    if (path.length > 1) {
      let target = result
      const leafKey = path.pop()
      for (const p of path) {
        if (!target[p]) {
          target[p] = {
            _custom: {
              value: {},
              display: p,
              tooltip: 'Module',
              abstract: true,
            },
          }
        }
        target = target[p]._custom.value
      }
      target[leafKey] = canThrow(() => getters[key])
    }
    else {
      result[key] = canThrow(() => getters[key])
    }
  })
  return result
}

function getStoreModule(moduleMap, path) {
  const names = path.split(BLOODPENGUX_MODULE_PATH_SEPARATOR).filter(n => n)
  return names.reduce(
    ({ module, getterPath }, moduleName, i) => {
      const child = module[moduleName === BLOODPENGUX_ROOT_PATH ? 'root' : moduleName]
      if (!child) {
        return null
      }
      return {
        module: i === names.length - 1 ? child : child._children,
        getterPath: child._rawModule.namespaced
          ? getterPath
          : getterPath.replace(`${moduleName}${BLOODPENGUX_MODULE_PATH_SEPARATOR}`, ''),
      }
    },
    {
      module: path === BLOODPENGUX_ROOT_PATH ? moduleMap : moduleMap.root._children,
      getterPath: path,
    },
  )
}

function canThrow(cb: () => any) {
  try {
    return cb()
  }
  catch (e) {
    return e
  }
}
