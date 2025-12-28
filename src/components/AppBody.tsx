import React, { type FC, type PropsWithChildren, useEffect, useRef } from 'react';
import viewContainer from './viewContainer';

// Track the currently active AppBody instance to prevent stale cleanups
let activeInstanceId = 0;

/**
 * A simple component that includes the correct structure for ViewManager pages
 * to exist alongside standard React pages.
 */
const AppBody: FC<PropsWithChildren<unknown>> = ({ children }) => {
    const instanceIdRef = useRef<number>(0);

    useEffect(() => {
        // Register this instance as active
        instanceIdRef.current = ++activeInstanceId;

        return () => {
            const myInstanceId = instanceIdRef.current;
            // Delay the reset to allow new AppBody to mount first.
            // ConnectionRequired may show a Loading state before mounting the new layout,
            // so we need a longer delay than queueMicrotask.
            setTimeout(() => {
                if (myInstanceId === activeInstanceId) {
                    viewContainer.reset();
                }
            }, 100);
        };
    }, []);

    return (
        <>
            <div className='mainAnimatedPages skinBody' />
            <div className='skinBody'>
                {children}
            </div>
        </>
    );
};

export default AppBody;
