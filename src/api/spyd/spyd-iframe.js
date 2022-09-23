export const spydIframe = getSpydIframe();

function getSpydIframe() {
    let markText_ = "";
    let postEvent_ = (name, data, options) => {
        if (window.top !== window.self) {
            if (window.parent) {
                window.parent.postMessage(
                    {
                        eventName: name,
                        eventData: data,
                        eventOptions: options
                    },
                    "*"
                )
            }
        }
    };
    let eventHandlers = {};
    return {
        getMark() { return markText_; },
        setMark(mark) { markText_ = mark; },
        addEventHandler(eventName, fn) {
            eventHandlers[eventName] = fn;
        },
        listen() {
            let eventMethod = window.addEventListener ? "addEventListener" : "attachEvent";
            let eventer = window[eventMethod];
            let messageEvent = eventMethod == "attachEvent" ? "onmessage" : "message";

            eventer(messageEvent, function (e) {

                let eventName = e.data.eventName;
                if (eventName) {
                    if (e.data.eventOptions) {
                        if (e.data.eventOptions.postToTop) {
                            if (window.top !== window.self) {
                                postEvent_(eventName, e.data.eventData, e.data.eventOptions);
                                return;
                            }
                        }
                    }

                    if (eventHandlers[eventName]) {
                        console.log(`[spydIframe] handling: ${JSON.stringify(e.data)} `);
                        eventHandlers[eventName](e.data.eventData);
                    }
                    //else {
                    //    postEvent(eventName, e.data.eventData, e.data.eventOptions);
                    //}
                }

            }, false);
        },
        postEvent(name, data, options) {
            postEvent_(name, data, options);
        }
    };
};