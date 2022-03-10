(function() {
    window.Loconote = function(parent, initialContent){
        
        // get parent DOM node
        let parentNode;
        if( typeof parent == "string" ){
            parentNode = document.querySelector(parent);
        }
        else{
            parentNode  = parent;
        }
    
        // load notebook in iframe
        let iframe = document.createElement("iframe");
        iframe.setAttribute('src', '/loconote/index.html');
        iframe.setAttribute('id', 'loconote_iframe');
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        iframe.style.border = 0;
        parentNode.appendChild(iframe);

        let setContent = function(contentObj){
            let msg = { type: "setContent", content: JSON.parse(contentObj) }
            iframe.contentWindow.postMessage( JSON.stringify(msg), window.origin );
        }

        let getContent = async function(){
            
            return new Promise( (res,rej) => {
                window.addEventListener("message", (msg) => {

                    // only trust same origin
                    if(msg.origin !== window.origin){
                        console.error("untrusted message origin ", msg.origin);
                        return;
                    }

                    let data = JSON.parse(msg.data);
                    if(data.content){
                        res(data.content);
                    }
                    else{
                        rej("unexpected response message: ", JSON.stringify(msg.data));
                    }
                }, { once: true } );

                iframe.contentWindow.postMessage( '{"type":"getContent"}', window.origin );
            } );
        }

        // set initial content
        if(initialContent){
            iframe.addEventListener("load", () => { setContent(initialContent) } );
        }

        return {
            setContent,
            getContent
        }
    }
})();
