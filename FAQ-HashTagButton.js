(function() {
  'use strict';
  
  const registerEvent = ['app.record.create.show', 'app.record.edit.show'];
  const changeEvent = ['app.record.create.change.TagTable','app.record.edit.change.TagTable'];
  const subDomain = 'https://8yiu5.cybozu.com/k/';
  const appId = kintone.app.getId();
  const subTableId = '.subtable-6419532'; //メンテナンス箇所
  
  //-----------------
  class ShowTableButton{
    constructor(tableSpace, table){
      console.log('ShowTableButtonが呼ばれました');
      this.tableSpace = tableSpace;
      this.table = table;
      console.log(this.tableSpace); 
    }
          showRecords(e){　//「一覧表示」ボタン押したときの処理
          
          const elem = e.target || e.srcElement;
          const btnId = elem.id.substring(3);
          const record = kintone.app.record.get().record;
          const tagValue = record.TagTable.value[btnId].value.tag_lu.value;
          
          //REST API のリクエストクエリ作成
          const query = 'tag_lu in ("'+tagValue+'") order by 更新日時 desc limit 100';
          //リクエストパラメータ作成
          const param = {
            'app' : appId,
            'query' : query
          };
          console.log(this.table);
          //REST　API処理開始
          return kintone.api(kintone.api.url('/k/v1/records', true), 'GET', param).then((resp) =>{
              if (resp.records[0] !== null){
                //レスポンスに何か入っていた場合
                let rowData = [];
                for (let j=0; j < resp.records.length; j++){
                      // console.log(j+':'+resp.records[j].レコード番号.value);
                      // console.log(j+':'+resp.records[j].質問.value);
                      // console.log(j+':'+resp.records[j].回答.value);
                  //RowData追加
                  rowData.push({RecNo:{text: resp.records[j].レコード番号.value}, Q:{text: resp.records[j].質問.value}, A:{text:resp.records[j].回答.value}});
                }
                this.table.setValue(rowData);
                this.table.show();
                // const tableSpace = kintone.app.record.getSpaceElement('tablespace');
                // tableSpace.style.display = 'block';
                
              } else {
                //レスポンスがなかった場合：テーブルセット
                  table.setValue([
                    {RecNo: {text: ''},
                      Q: { text: 'レコードが見つかりませんでした' },
                      A: { text:''}
                    }
                  ]);
                
              }
            })
            
          
        }  //function setButton 終わり
  }
  //-----------------
  
  kintone.events.on('app.record.detail.show', function(event) {
    const record = event.record;
    const tableSpace = kintone.app.record.getSpaceElement('tablespace');
    const set_interval_id = setInterval(setButton, 300); //0.3秒後に「一覧表示」ボタン配置される
    
    
    function setButton(){
      clearInterval(set_interval_id);
        //ボタンの場所
        const subTableElement = kintone.app.record.getFieldElement('TagTable');
        const el_tRows = subTableElement.tBodies[0].rows;
            // console.log(el_tRows);

              const table = new kintoneUIComponent.Table({
                actionButtonsShown: false,
                isVisible: false,
                columns: [
                  {
                    header: 'RecNo',
                    cell: function() { return kintoneUIComponent.createTableCell('label', 'RecNo',
                      {onClick: function(event) {
                        const rowIndex = event.rowIndex;
                        // console.log(rowIndex);
                        const RecNo = event.data[rowIndex].RecNo.text;
                        const direc = `${subDomain}${appId}/show#record=${RecNo}&tab=none`;
                        // console.log(direc);
                        const newwindow = window.open(direc);
                      }}) }
                  },
                  {
                    header: 'Question',
                    cell: function() { return kintoneUIComponent.createTableCell('label', 'Q') }
                  },
                  {
                    header: 'Answer',
                    cell: function() { return kintoneUIComponent.createTableCell('label', 'A') }
                  }
                ]
              });
      tableSpace.appendChild(table.render());
        //ボタン配置
        for (let i=0 ; i < el_tRows.length; i++){
          let simpleButton = document.createElement('button');
          simpleButton.setAttribute('id','tag'+i);
          simpleButton.innerText='一覧表示';
          simpleButton.onclick = ButtonOnClick;
          el_tRows[i].appendChild(simpleButton);
        }
      function ButtonOnClick(e){
        const showTable = new ShowTableButton(tableSpace,table).showRecords(e);
      }
        
    } 
  });
  //End detail.show
  
  //登録時
  kintone.events.on(registerEvent, function(event) {
    const record = event.record;
    const targetAppId = kintone.app.getLookupTargetAppId('tag_lu');
    //ボタンの場所
    const tagTableEl = document.querySelector(subTableId);  //Error
    // console.log(tagTableEl);
    const btnEl = tagTableEl.querySelectorAll('.input-clear-gaia');
    // console.log(btnEl);
    
    for (let i=0; i < btnEl.length; i++){
      btnEl[i].insertAdjacentHTML('afterend', '<button class="reg" id="btn'+i+'">登録</button>');
      let btnTagRegEl = document.querySelector('#btn'+i);
      btnTagRegEl.onclick = regTag;
    }
    
    function regTag(e){　//「登録」ボタンを押したときの動き
      var elem = e.target || e.srcElement;
      var btnId = elem.id.substring(3);
      var record = kintone.app.record.get().record;
      var tagValue = record.TagTable.value[btnId].value.tag_lu.value;
      // console.log(tagValue);
      
      return kintone.api(kintone.api.url('/k/v1/record.json',true),'POST',{"app": targetAppId, "record": {"tag": {"value":tagValue}}}).then((resp)=>{
        //成功したときの処理
        var notifyPopup = new kintoneUIComponent.NotifyPopup({text: 'タグの登録成功しました', type: 'success'});
        var alertEl = document.querySelector('.subtable-row-label-text-gaia');
        var notifyEl = document.querySelector('.kuc-notify');
        if(notifyEl){
          notifyEl.remove();
        }
        alertEl.appendChild(notifyPopup.render());
      }).catch((resp)=>{
        //失敗した時
        var notifyPopup = new kintoneUIComponent.NotifyPopup({text: 'タグの登録失敗しました：' + resp.message, type: 'error'});
        var alertEl = document.querySelector('.subtable-row-label-text-gaia');
        var notifyEl = document.querySelector('.kuc-notify');
        if(notifyEl){
          notifyEl.remove();
        }
        alertEl.appendChild(notifyPopup.render());
      });
    } //「登録」ボタンを押したときの動き　終わり
    
      //テーブルが増減した時（ボタンをふりなおします）
  kintone.events.on(changeEvent, function(event) {
      const record = event.record;
      const targetAppId = kintone.app.getLookupTargetAppId('tag_lu');
        //ボタンの消去
      const removingButton = document.querySelectorAll('.reg');
      if(removingButton){
          for (let k = 0; k < removingButton.length; k++){
            removingButton[k].remove();
          }
      }
        //ボタンの場所
      const tagTableEl = document.querySelector(subTableId);
      const btnEl = tagTableEl.querySelectorAll('.input-clear-gaia');
        //ボタンふりなおし 
      for (let i=0; i < btnEl.length; i++){
      btnEl[i].insertAdjacentHTML('afterend', '<button class="reg" id="btn'+i+'">登録</button>');
      let btnTagRegEl = document.querySelector('#btn'+i);
      btnTagRegEl.onclick = regTag;
    }
      
  });
    
  });
  
})();
