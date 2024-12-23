import React, { useState, useEffect, useRef } from 'react'
import { Sidebar, Menu, MenuItem, SubMenu } from 'react-pro-sidebar'
import css from './ToolBar.module.css'
import FileCopyIcon from '@mui/icons-material/FileCopy'
import SearchIcon from '@mui/icons-material/Search'
import GitBranch from './GitBranch';
const { ipcRenderer } = window.require('electron')
import './ToolBar.module.css';
import { Scrollbar } from 'react-scrollbars-custom'
import { Resizable } from 're-resizable'
import { Editor } from './Editor'


const filelegends = {
  text: { color: 'green', edit: true },
  txt: { color: 'green', edit: true },
  html: { color: 'orange', edit: true },
  xml: { color: 'white', edit: true },
  json: { color: 'white', edit: true },
  jpg: { color: 'red', edit: false },
  png: { color: 'red', edit: false },
  jpeg: { color: 'red', edit: false },
  ico: { color: 'red', edit: false },
  bmp: { color: 'red', edit: false },
  php: { color: 'cream', edit: true },
  js: { color: 'yellow', edit: true },
  css: { color: 'majenta', edit: true },
  ts: { color: 'yellow', edit: true },
  tsx: { color: 'yellow', edit: true },
  jsx: { color: 'yellow', edit: true },
  folder: { color: 'green', edit: false },
  gitignore: { color: 'brown', edit: true },
  config: { color: 'brown', edit: true },
  md: { color: 'blue', edit: true },
}

interface wcoords {
  width: number
  height: number
} 

const ToolBar: React.FC<wcoords> = ({ width, height }) => {
  const [hover, setHover] = useState(0);
  const [folderPath, setFolderPath] = useState('');
  const [folderContent, setFolderContent] = useState<any[]>([]);
  const [windowSize, setWindowSize] = useState({ width: 800, height: 600 });
  const [filecontent, setFileContent] = useState('');
  const optionspanel = useRef<HTMLDivElement>(null);
  const filespanel = useRef<HTMLDivElement>(null);
  const [editorpanelWidth, setEditorPanelWidth] = useState(0)
  const [editorpanelHeight, setEditorPanelHeight] = useState(0)
  const [updateContent, setUpdateContent] = useState(false)

  let counter = 0;

  const mouseover = () => {
    setHover(1)
  }

  const mouseout = () => {
    setHover(0)
  }

  const filesadd = () => {
    ipcRenderer.send('open-folder-dialog');
  }

  const handleGetFolderContent = () => {
    if (folderPath) {
      ipcRenderer.send('get-folder-content', folderPath)
    }
  };

  const AddCounter = (items) => {
    items.forEach((item) => {
      counter++
      item.counter = counter
      if (item.children) {
        AddCounter(item.children)
      }
    })
  }

  ipcRenderer.on('selected-folder', (event, selectedFolderPath) => {
    if (selectedFolderPath[0]){
      setFolderPath(selectedFolderPath[0])
    } else {
      const loadData = async () => {
        const data = await ipcRenderer.invoke('load-json');
        if (data && data[0]){
          let nm = data[0].fullPath.split(data[0].name)[0];
          nm = nm.substr(0, nm.length - 1)
          setFolderPath(nm)
        }
        counter = 0;
        AddCounter(data);
        setFolderContent(data);
      };
      loadData();
    }
  });

  ipcRenderer.on('folder-content', (event, content) => {
    AddCounter(content);
    setFolderContent(content);
  });

  useEffect(() => {
    handleGetFolderContent()
  }, [folderPath]);

  const getFileName = (name) => {
    if (name) {
      return name.replace(/\\/g, '/').split('/').slice(-1)
    }
    return ''
  }

  useEffect(()=>{
    adjustEditorSize(windowSize.width, windowSize.height)
  }, [windowSize])

  useEffect(() => {
    setWindowSize({ width: width, height: height })
  }, [width, height])

  useEffect(() => {
    setTimeout(() => {
      const loadData = async () => {
        const data = await ipcRenderer.invoke('load-json');
        if (data && data[0]){
          let nm = data[0].fullPath.split(data[0].name)[0];
          nm = nm.substr(0, nm.length - 1)
          setFolderPath(nm)
        }
        let counter = 0;
        const fdata = data.map((item) => {
          const itm = item;
          counter++;
          itm.counter = counter;
          if (itm.children){
            counter++
            itm.children = itm.children.map((child) => {
              const chl = child
              chl.counter = counter
              counter++;
              return chl;
            });
          }
          return itm;
        })
        setFolderContent(fdata);
      };
      loadData();
    }, 500)
  }, [])

  const renderFoldersAndFiles = (items) => (
    items.map((item) =>
      item.isDirectory ? (
        <SubMenu
          className={css.submenu}
          key={item.fullPath}
          label={item.name}
          id={`e_${item.counter}`}
          style={{ background: 'transparent', color: 'white' }}
        >
          {item.children && renderFoldersAndFiles(item.children)}
        </SubMenu>
      ) : (
        <MenuItem
          className={css.menuitem}
          key={item.fullPath}
          id={`e_${item.counter}`}
          onClick={() =>
            filelegends[item.type] && filelegends[item.type].edit ? readFile(item.fullPath) : ''
          }
          style={{
            color: `${filelegends[item.type] ? filelegends[item.type].color : 'green'}`
          }}
        >
          {item.name}
        </MenuItem>
      )
    )
  )

  const readFile = (file) => {
    ipcRenderer.send('read-file', file);
  };

  ipcRenderer.on('read-file-reply', (event, error, data) => {
    if (error) {
      console.error(error);
    } else {
      setFileContent(data);
      setUpdateContent(true);
    }
  });



  const spanReplace = (items) => {
    items.forEach((item) => {
      if (item.isDirectory) {
        let foldersequence = item.fullPath.replace(/\\/g, '/');
        const fname = getFileName(folderPath);
        foldersequence = foldersequence.split(fname)[1];
        foldersequence = foldersequence.split('/');
        const spacing = foldersequence.length * 12;
        if (item.span){
          item.span.style.marginLeft = `${spacing}px`
        }
        if (item.children) {
          spanReplace(item.children)
        }
      } 
    })
  }

  const spanAdd = (items) =>{
    items.forEach((item) => {
      if (item.isDirectory) {
        const id = '[id="e_' + item.counter + '"]'
        item.span = document
          .querySelector(id)
          ?.querySelector('.ps-submenu-expand-icon')
          ?.querySelector('span')
        if (item.children) {
          spanAdd(item.children)
        }
      }
    })
  }

  useEffect(()=>{
    const filespanelsize = { width: 0, height: 0 }
    if (filespanel.current){
      filespanelsize.width = (filespanel.current.parentNode as HTMLElement).offsetWidth
      filespanelsize.height = (filespanel.current.parentNode as HTMLElement).offsetHeight
    }
    const optionspanelsize = { width: 0, height: 0 }
    if (optionspanel.current){
      optionspanelsize.width = (optionspanel.current as HTMLElement).offsetWidth
      optionspanelsize.height = (optionspanel.current as HTMLElement).offsetHeight
    }
    const win = windowSize.width - filespanelsize.width - optionspanelsize.width - 10;
    const hgt = windowSize.height - 140;
    setEditorPanelWidth(win);
    setEditorPanelHeight(hgt);
  }, [filespanel.current, optionspanel.current, windowSize.width, windowSize.height])

  const adjustEditorSize = (width, height) => {
    const filespanelsize = { width: 0, height: 0 }
    if (filespanel.current){
      filespanelsize.width = (filespanel.current as HTMLElement).offsetWidth
      filespanelsize.height = (filespanel.current as HTMLElement).offsetHeight
    }
    const optionspanelsize = { width: 0, height: 0 }
    if (optionspanel.current){
      optionspanelsize.width = (optionspanel.current as HTMLElement).offsetWidth
      optionspanelsize.height = (optionspanel.current as HTMLElement).offsetHeight
    }
    const hgt = windowSize.height - 140;
    setEditorPanelWidth(width - filespanelsize.width - optionspanelsize.width - 10);
    setEditorPanelHeight(hgt);
  }

  useEffect(() => {
    if (folderContent.length > 0){
      ipcRenderer.send('save-json', folderContent)
    }
    setTimeout(() => {
      spanAdd(folderContent)
      spanReplace(folderContent);
    }, 2000)
  }, [folderContent]);

  const updateValue = (newValue) =>{
    setFileContent(newValue)
  }

  const updateContentChange = () => {
    setUpdateContent(false)
  }

  return (
    <>
      <div
        className={css.main}
        style={{ width: `${windowSize.width}px`, height: `${windowSize.height}px` }}
      >
        <Scrollbar style={{ width: `10vw`, height: `${windowSize.height}px` }}>
          <div ref={optionspanel}>
            <Sidebar id="buttonsbar" width="10vw" style={{ border: 'none', height: '100%' }}>
              <Menu
                menuItemStyles={{
                  button: {
                    backgroundColor: 'transparent',
                    strokeOpacity: '0',
                    stroke: '#000',
                    '&:hover': {
                      backgroundColor: 'transparent',
                      strokeOpacity: '.1'
                    }
                  }
                }}
              >
                <MenuItem
                  onClick={filesadd}
                  icon={<FileCopyIcon className={css.icon} />}
                ></MenuItem>
                <MenuItem icon={<SearchIcon className={css.icon} />}> </MenuItem>
                <MenuItem
                  icon={
                    <GitBranch
                      class={css.imageicon}
                      onMouseOver={mouseover}
                      onMouseOut={mouseout}
                      hover={hover}
                    />
                  }
                >
                  {' '}
                </MenuItem>
              </Menu>
            </Sidebar>
          </div>
        </Scrollbar>
        {folderPath ? (
          <>
            <Resizable
              defaultSize={{ width: '20vw', height: '100%' }}
              onResizeStop={(e, direction, ref, d) => {
                adjustEditorSize(windowSize.width, windowSize.height)
              }}>
              <div style={{ width: '98%', height: '100%' }}>
                <div ref={filespanel} className={css.explorerText}>
                  EXPLORER
                </div>
                <Sidebar
                  backgroundColor="transparent"
                  width="98%"
                  id="menusidebar"
                  style={{ border: 'none', height: '100%' }}
                >
                  <Menu
                    menuItemStyles={{
                      button: {
                        backgroundColor: 'transparent',
                        strokeOpacity: '1',
                        stroke: '#000',
                        opacity: '1',
                        '&:hover': {
                          backgroundColor: 'transparent',
                          strokeOpacity: '.5',
                          opacity: '1'
                        }
                      }
                    }}
                  >
                    <SubMenu style={{ color: 'white' }} label={getFileName(folderPath)}>
                      <Scrollbar
                        style={{
                          width: `100%`,
                          height: `${windowSize.height}px`,
                          border: 'none',
                        }}
                      >
                        {folderContent.length > 0 && renderFoldersAndFiles(folderContent)}
                      </Scrollbar>
                    </SubMenu>
                  </Menu>
                </Sidebar>
              </div>
            </Resizable>
          </> 
        ) : (
          ''
        )}
        <div
          id="editor"
          className={css.editor}
          style={{ width: `${editorpanelWidth}px`, height: `${editorpanelHeight}px` }}
        >
          {folderPath && filecontent ? (
            <Editor
              name="editarea"
              value={filecontent}
              onValueChange={(value: string) => setFileContent(value)}
              numOfLines={1}
              key="contenteditor"
              updateValue={updateValue}
              updateContent={updateContent}
              updateContentChange={updateContentChange}
            />
          ) : (
            ''
          )}
        </div>
      </div>
    </>
  )
}

export default ToolBar
