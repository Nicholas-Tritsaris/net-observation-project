
window.onload=function(){
  const ctx=document.getElementById('chart1');
  if(ctx){
    new Chart(ctx,{
      type:'line',
      data:{labels:['A','B','C'], datasets:[{label:'Traffic', data:[10,40,25]}]},
      options:{responsive:true}
    });
  }
};

function toggleTheme(){
  document.body.classList.toggle('dark');
  document.body.classList.toggle('light');
}

function toggleSidebar(){
  document.querySelector('.sidebar').classList.toggle('collapsed');
}

document.getElementById('searchBox').addEventListener('input',function(){
  const text=this.value.toLowerCase();
  document.querySelectorAll('main section').forEach(sec=>{
    sec.style.display=sec.innerText.toLowerCase().includes(text)?'block':'none';
  });
});
