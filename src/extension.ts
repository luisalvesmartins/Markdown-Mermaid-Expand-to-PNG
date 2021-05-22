// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { metadataPNG } from "./metadataPNG";
//import { resolveCliPathFromVSCodeExecutablePath } from 'vscode-test';
const Jimp = require('jimp');

// async function getImage(url:string) {
// 	const response = await got(url);
// 	return response.body;
// }

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {

	let disposable = vscode.commands.registerCommand('markdown-code-to-png.topng',async () => {
		// The code you place here will be executed every time your command is executed

		const editor = vscode.window.activeTextEditor;

		// Display a message box to the user
		if (editor){
			var markdown=editor.document.getText();
            var sourcePath = editor.document.uri.path;
            var parts = sourcePath.split("/");
			var fileName=parts[parts.length-1];

			var p=markdown.toLowerCase().indexOf("```mermaid",0);
			var blockNumber=0;
			while (p>=0)
			{
				var pEnd=markdown.toLowerCase().indexOf("```",p+4);
				if (pEnd<=0)
				{
					vscode.window.showErrorMessage('Inconsistent block delimiter');
				}
				console.log("Block:" + p + " to " + pEnd);
				blockNumber++;
				var newBlock="![block" + blockNumber + "](" + fileName + "." + blockNumber + ".png)]";
				var mermaid=markdown.substr(p+12,pEnd-p-12);
				markdown=markdown.substr(0,p-1) + newBlock + markdown.substr(pEnd+3);
				pEnd=p+newBlock.length;

				const encoded = Buffer.from(mermaid).toString("base64");

				var url="https://mermaid.ink/img/" + encoded;
				
				var image1:any;
				try {
					image1=await Jimp.read(url);
				} catch (error) {
					console.log(error);
					console.log("XX" + mermaid + "XX")
				}

				var buf=await image1.getBufferAsync(Jimp.MIME_PNG); 
				var image8= new Uint8Array(buf);
				var imageWithMetadata = metadataPNG.savetEXt(image8, encoded);					

				var pngPath = vscode.Uri.file(sourcePath + "." + blockNumber + ".png");
				await vscode.workspace.fs.writeFile(pngPath, imageWithMetadata);


				p=markdown.toLowerCase().indexOf("```mermaid",pEnd+2);
			}
			editor.edit(editBuilder => {
				editBuilder.delete(new vscode.Range(new vscode.Position(0,0),new vscode.Position(1009,100)));
				editBuilder.insert(new vscode.Position(0,0),markdown);
			});
			vscode.window.showInformationMessage("PNGs Exported");
		}
		else{
			vscode.window.showErrorMessage('No markdown file open');
		}
	});

	let disposableToo = vscode.commands.registerCommand('markdown-png-to-code.topng',async () => {
		// The code you place here will be executed every time your command is executed

		const editor = vscode.window.activeTextEditor;

		// Display a message box to the user
		if (editor){
			var markdown=editor.document.getText();
            var sourcePath = editor.document.uri.path;
            var parts = sourcePath.split("/");
			var fileName=parts[parts.length-1];

			var p=markdown.toLowerCase().indexOf("(" + fileName + ".",0);
			var blockNumber=0;
			while (p>=0)
			{
				var pEnd=markdown.toLowerCase().indexOf(")",p);
				if (pEnd<=0)
				{
					vscode.window.showErrorMessage('Inconsistent block delimiter');
				}
				console.log("Block:" + p + " to " + pEnd + "->" + markdown.substr(p+1,pEnd-p-1));

				var q=markdown.substr(0,p).lastIndexOf("!");

				var file=markdown.substr(p+1,pEnd-p-1);
				var file1=editor.document.uri.path.replace(fileName,file) ;
				
				const decode = (str: string):string => Buffer.from(str, 'base64').toString('binary');

				const U:vscode.Uri=vscode.Uri.parse(file1);
				try {
					var image8=await vscode.workspace.fs.readFile(U);
					var t=metadataPNG.gettEXt(image8);	
					if(t){
						var decoded = decode(t);
						console.log("decoded");
						console.log(decoded);
						decoded="```mermaid\n" + decoded + "```";
						markdown=markdown.substr(0,q-1) + decoded + markdown.substr(pEnd+2);
						pEnd=pEnd+decoded.length;
					}
					
				} catch (error) {
					console.log("ERROR");
					console.log(error);
				}

				p=markdown.toLowerCase().indexOf("(" + fileName + ".",q+2);
			}
			editor.edit(editBuilder => {
				editBuilder.delete(new vscode.Range(new vscode.Position(0,0),new vscode.Position(1009,100)));
				editBuilder.insert(new vscode.Position(0,0),markdown);
			});
		}
		else{
			vscode.window.showErrorMessage('No markdown file open');
		}
	});

	context.subscriptions.push(disposable);
	context.subscriptions.push(disposableToo);
}

// this method is called when your extension is deactivated
export function deactivate() {}
