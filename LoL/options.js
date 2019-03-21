
 let page = document.getElementById('buttonDiv');
 
 
 function constructbutton() {
   
     let button = document.createElement('button');
     button.innerHTML = "Submit";
     button.addEventListener('click', function() {
        var item = document.getElementById("box").value;
        var item2 = document.getElementById("reg").value;
        
        if(item.trim() !== ""){
        chrome.storage.sync.set({name: item})
        chrome.storage.sync.set({reg: item2})
            alert("The new name has been set");
        }else{
            alert("Please enter a username.");
        }
    });
     page.appendChild(button);
   
 }
 constructbutton();
       