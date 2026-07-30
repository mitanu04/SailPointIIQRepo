(function () {
    const DEBOUNCE_TIME = 2000;

    let activeRequests = 0;
    let overlay;
    let debounceTimer = null;
    let activeXHRInstances = []; // Store active XHR instances

    // Updated hideOverlay function with a context check
    function hideOverlay() {
        overlay = document.getElementById('loadingOverlay');

        if (overlay) {
            overlay.style.display = 'none';
        }

        // Remove listeners only for instances belonging to this context
        activeXHRInstances = activeXHRInstances.filter((xhrInstance) => {
            if (xhrInstance.isCustomInstance && xhrInstance.removeListeners) {
                xhrInstance.removeListeners();
                return false; // Remove this instance from the array
            }
            return true; // Retain if not removable
        });
    }

    const originalXHR = window.XMLHttpRequest;

    function waitForDebounce() {
        debounceTimer = setTimeout(() => {
            // First, clean up listeners and hide the overlay
            hideOverlay();

            // Then reset XMLHttpRequest to its original implementation
            window.XMLHttpRequest = originalXHR;
        }, DEBOUNCE_TIME);
    }


    // Declare handlers separately so they can be removed later
    function onLoadStart(xhr) {
        console.log('XHR Started. Active Requests: ', activeRequests, '  Request URL: ', xhr.requestName);
        activeRequests++;

        if (debounceTimer) {
            clearTimeout(debounceTimer);
        }
    }

    function onLoadEnd(xhr) {
        console.log('XHR Ended. Active Requests: ', activeRequests, '  Request URL: ', xhr.requestName);
        activeRequests--;
        if (activeRequests === 0) {
            waitForDebounce();
        }
    }

    function CustomXHR() {
        const xhr = new originalXHR();
        const originalOpen = xhr.open;

        // Mark this instance as created by CustomXHR
        xhr.isCustomInstance = true;

        xhr.open = function (method, url, async, user, password) {
            xhr.requestName = url; // Capture URL of the request for logging
            originalOpen.call(xhr, method, url, async, user, password);

            // Add to activeXHRInstances only if it's a valid CustomXHR instance
            if (xhr.isCustomInstance) {
                activeXHRInstances.push(xhr);
            }
        };

        // Bind handlers to this instance
        const boundOnLoadStart = () => onLoadStart(xhr);
        const boundOnLoadEnd = () => onLoadEnd(xhr);

        xhr.addEventListener('loadstart', boundOnLoadStart);
        xhr.addEventListener('loadend', boundOnLoadEnd);

        // Add a method to remove event listeners
        xhr.removeListeners = function () {
            xhr.removeEventListener('loadstart', boundOnLoadStart);
            xhr.removeEventListener('loadend', boundOnLoadEnd);
        };

        return xhr;
    }

    window.XMLHttpRequest = CustomXHR;

})();