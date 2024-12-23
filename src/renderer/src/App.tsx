import React, { useState, useEffect } from 'react'
import css from './App.module.css'
import Toolbar from './components/Toolbar'
const { ipcRenderer } = window.require('electron')

const App: React.FC = () => {
  const [windowSize, setWindowSize] = useState({ width: 800, height: 600 });

  useEffect(() => {
    const getInitialWindowSize = async () => {
      const initialSize = await ipcRenderer.invoke('get-initial-window-size');
      setWindowSize(initialSize);
    };

    getInitialWindowSize();

    const handleWindowSizeChanged = (event, newSize) => {
      setWindowSize(newSize);
    };

    ipcRenderer.on('window-size-changed', handleWindowSizeChanged);

    return () => {
      ipcRenderer.removeListener('window-size-changed', handleWindowSizeChanged);
    };
  }, []);

  return (
    <>
      <div
        className={css.main}
        style={{ width: `${windowSize.width}px`, height: `${windowSize.height}px` }}
      >
        <Toolbar height={windowSize.height} width={windowSize.width} />
      </div>
    </>
  )
}

export default App
