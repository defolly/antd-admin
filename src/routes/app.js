/* global window */
import React from 'react'
import NProgress from 'nprogress'
import PropTypes from 'prop-types'
import pathToRegexp from 'path-to-regexp'
import { connect } from 'dva'
import { Layout, Loader } from 'components'
import { classnames, config } from 'utils'
import { Tabs } from 'antd'
import { Helmet } from 'react-helmet'
import { withRouter, routerRedux } from 'dva/router'
import '../themes/index.less'
import './app.less'
import Error from './error'

import lodash from 'lodash'

const { prefix, openPages } = config

const TabPane = Tabs.TabPane;

const { Header, Bread, Footer, Sider, styles } = Layout

let lastHref


const moduleArr = []
let activeKey = '0';

const App = ({ children, dispatch, app, loading, location }) => {
  const { user,   siderFold, darkTheme, isNavbar, menuPopoverVisible, navOpenKeys, menu, permissions } = app
  let { pathname } = location
  pathname = pathname.startsWith('/') ? pathname : `/${pathname}`
  const { iconFontJS, iconFontCSS, logo } = config
  const current = menu.filter(item => pathToRegexp(item.route || '').exec(pathname))
  const hasPermission = current.length ? permissions.visit.includes(current[0].id) : false
  const href = window.location.href

  if (lastHref !== href) {
    NProgress.start()
    if (!loading.global) {
      NProgress.done()
      lastHref = href
    }
  }

  const headerProps = {
    menu,
    user,
    location,
    siderFold,
    isNavbar,
    menuPopoverVisible,
    navOpenKeys,
    switchMenuPopover () {
      dispatch({ type: 'app/switchMenuPopver' })
    },
    logout () {
      dispatch({ type: 'app/logout' })
    },
    switchSider () {
      dispatch({ type: 'app/switchSider' })
    },
    changeOpenKeys (openKeys) {
      dispatch({ type: 'app/handleNavOpenKeys', payload: { navOpenKeys: openKeys } })
    },
  }

  const siderProps = {
    menu,
    location,
    siderFold,
    darkTheme,
    navOpenKeys,
    changeTheme () {
      dispatch({ type: 'app/switchTheme' })
    },
    changeOpenKeys (openKeys) {
      window.localStorage.setItem(`${prefix}navOpenKeys`, JSON.stringify(openKeys))
      dispatch({ type: 'app/handleNavOpenKeys', payload: { navOpenKeys: openKeys } })
    },
  }

  const breadProps = {
    menu,
    location,
  }
  if (openPages && openPages.includes(pathname)) {
    return (<div>
      <Loader fullScreen spinning={loading.effects['app/query']} />
      {children}
    </div>)
  }
  if (current.length) {
    let cu = lodash.cloneDeep(children);

    if (moduleArr.filter(item => item.key === current[0].route).length == 0) {
      moduleArr.push({
        title: current[0].name,
        content: cu,
        key: current[0].route
      })
    }
    activeKey = current[0].route      
  }
  if (moduleArr.length < 1) return (<div></div>);


  const onChange = (key) => {   
    dispatch(routerRedux.push({ pathname: key}))
 } 

  const remove = (targetKey) => {
    let curKey = activeKey;
    let lastIndex;
    moduleArr.forEach((pane, i) => {
      if (pane.key === targetKey) {
        lastIndex = i - 1;
      }
    });
    moduleArr.splice(lastIndex + 1,1);
    if (lastIndex >= 0 && curKey === targetKey) {
      curKey = moduleArr[lastIndex].key;
    }
    dispatch(routerRedux.push({ pathname: curKey }))
  }  

  const onEdit = (targetKey, action) => {
    if (action == "remove") {
      remove(targetKey)
    }  
     //[action](targetKey);
   }

  return (
    <div>
      <Loader fullScreen spinning={loading.effects['app/query']} />
      <Helmet>
        <title>eud</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="icon" href={logo} type="image/x-icon" />
        {iconFontJS && <script src={iconFontJS} />}
        {iconFontCSS && <link rel="stylesheet" href={iconFontCSS} />}
      </Helmet>
      <div className={classnames(styles.layout, { [styles.fold]: isNavbar ? false : siderFold }, { [styles.withnavbar]: isNavbar })}>
       
        <Header {...headerProps} />
        {!isNavbar ? <aside className={classnames(styles.sider, { [styles.light]: !darkTheme })}>
          {siderProps.menu.length === 0 ? null : <Sider {...siderProps} />}
        </aside> : ''}
        <div className={styles.main}>
        
          {/*<Bread {...breadProps} />*/}
          <div className={styles.container}>
            <div className={styles.content}>
              {/*{hasPermission ? children : <Error />}*/}
              <Tabs type="editable-card" onEdit={onEdit} activeKey={activeKey} onChange={onChange} hideAdd>               
               
                {moduleArr.map(pane => <TabPane tab={pane.title} key={pane.key} >{pane.content}</TabPane>)}
              </Tabs>
            </div>
          </div>
          <Footer />
        </div>
      </div>
    </div>
  )
}

App.propTypes = {
  children: PropTypes.element.isRequired,
  location: PropTypes.object,
  dispatch: PropTypes.func,
  app: PropTypes.object,
  loading: PropTypes.object,  
}

export default withRouter(connect(({ app, loading }) => ({ app, loading }))(App))
