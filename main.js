define(function (/* require, exports, module */) {
	"use strict";
    var DocumentManager = brackets.getModule("document/DocumentManager"),
    EditorManager = brackets.getModule("editor/EditorManager"),
    CommandManager = brackets.getModule("command/CommandManager"),
    Menus = brackets.getModule("command/Menus"),
    editorContextMenu = Menus.getContextMenu(Menus.ContextMenuIds.EDITOR_MENU);

    var commandID = "jzmstrjp.brackets-reverse-emmet.main";

    CommandManager.register("Reverse Emmet", commandID, main);
    editorContextMenu.addMenuDivider();
    editorContextMenu.addMenuItem(commandID, "Ctrl-Shift-E");
    editorContextMenu.addMenuDivider();

    var global_selector = "";
    var mae_depth = 0;

    function reindent(codeMirror, from, to) {
		codeMirror.operation(function () {
			codeMirror.eachLine(from, to, function (line) {
				codeMirror.indentLine(line.lineNo(), "smart");
			});
		});
    }
    
    function getMode(editor) {
        var mode = editor.getModeForSelection();
        return mode;
    }

    function main(){
        global_selector = "";//リセット
        mae_depth = 0;//リセット
        var editor = EditorManager.getCurrentFullEditor();
        var mode = getMode(editor);
        if(mode !== "html"){
            return;
        }
        var currentDoc = DocumentManager.getCurrentDocument();
        var sel = editor.getSelection();
        var text = editor.getSelectedText(false);
        var selector = make_selector(text);
        if(!selector){
            return;
        }
        currentDoc.batchOperation(function() {
            editor.document.replaceRange(selector, sel.end, sel.end);
            reindent(editor._codeMirror, sel.end.line, sel.end.line+2);
            editor.setSelection({line: sel.end.line+1, ch: 1000});
        });
    }

    function make_selector(text){
        var $text = $("<div>"+text+"</div>");
        if($text[0].children.length === 0){
            return false;
        }
        make_selector2($text);
        global_selector = global_selector.slice(5);//「>div>」を取る
        while(/\^$/.test(global_selector)){//末尾に^が有る限り
            global_selector = global_selector.replace(/\^$/,"");//消す。
        }
        global_selector = global_selector.replace(/}\+\+{/g,"");//}++{を消す。
        global_selector = "(" + global_selector + ")*5";
        return "\n" + global_selector;
    }

    function incre(moji){
        if(/\d$/.test(moji)){//末尾が数字なら
            return moji.replace(/\d$/,"$@2");
        }else{
            return moji;
        }
    }

    function noEX(path){
        var arr = path.split(".");
        arr.pop();
        return arr.join(".");
    }

    function onlyEX(path){
        var arr = path.split(".");
        return "." + arr[arr.length - 1];
    }

    function make_selector2($text, childMode, depth_arg){
        [].forEach.call($text, function(elm, i){            
            var depth = depth_arg || 0;
            var my_selector = "";
            var hajime = "+";
            var add_selector = "";
            var naiyou = "";
            var all_br = false;

           

            if(elm.tagName && elm.tagName !== "BR"){
                my_selector = elm.tagName.toLowerCase();
            }

            if(childMode){
                depth++;
            }
            if(i === 0){
                hajime = ">";
            }
            var sa = mae_depth - depth;
            if(sa > 0){//階層上がってたら
                hajime = "";
                for (var index = 0; index < sa; index++) {
                    hajime += "^";
                }
            }

            if(elm.nodeName === "#text"){//テキストノードだった場合で
                if(/\S/.test(elm.textContent)){//空白以外の文字があれば
                    naiyou = elm.textContent;
                    while(/(^\s)|(\s$)/.test(naiyou)){
                        naiyou = naiyou.replace(/(^\s)|(\s$)/g, "");//先頭と末尾の空白文字を削除。
                    }
                    naiyou = "{" + incre(naiyou) + "}";
                }
            }

            if(elm.classList){
                [].forEach.call(elm.classList, function(className){
                    my_selector += "." + incre(className);
                });
            }
            
            if(elm.id){
                my_selector += "#" + incre(elm.id);
            }
            if(elm.tagName === "IMG" && elm.getAttribute("src")){
                add_selector += "[" + incre(noEX(elm.getAttribute("src"))) + onlyEX(elm.getAttribute("src")) + "]";
            }
            
            
            global_selector += hajime + my_selector + add_selector + naiyou;
            
            mae_depth = depth;
            if(elm.childNodes.length > 0){
                make_selector2(elm.childNodes, true, depth);
            }
        });
    }
});
