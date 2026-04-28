window.addEventListener('load', async () => {
	const CORPS_TOOLS_URL = `${location.protocol}//${location.hostname === 'localhost' ? location.host : 'corps.tools'}`;
	const endorsementScriptElem = document.querySelector('[data-corpstools-endorsement]');
	const parsedPosition = endorsementScriptElem.dataset.position.split('-');

	const posPadding = '1rem';

	document.head.innerHTML += `
<style>
	.ct-endorsement {
		position: fixed;
		width: 48px;
		height: 48px;
		cursor: pointer;
		${parsedPosition[0]}: ${posPadding};
		${parsedPosition[1]}: ${posPadding};
		transition: all 150ms ease;
		opacity: 0.5;
	}

	.ct-endorsement:hover {
		${parsedPosition[0]}: calc(${posPadding} + 8px);
		opacity: 0.95;
	}

	.ct-endorsement .b-ge {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		border-radius: 6px;
		background: #fefefe;
		box-shadow:  10px 10px 30px #5f5f5f,
			 -10px -10px 30px #ffffff;
		opacity: 0.9;
	}

	.ct-endorsement .f-ge {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		padding: 6px;
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.ct-endorsement img {
		width: 100%;
		user-drag: none;
		-webkit-user-drag: none;
		user-select: none;
		-moz-user-select: none;
		-webkit-user-select: none;
		-ms-user-select: none;
	}
</style>
`;
	
	const imageURL = `${CORPS_TOOLS_URL}/logo.png`;
	
	const endorsementElem = document.createElement('div');
	document.body.appendChild(endorsementElem);
	endorsementElem.outerHTML = `<div class="ct-endorsement" onclick="window.open('https://corps.tools')">
	<div class="b-ge"></div>
	<div class="f-ge">
		<img src="${imageURL}" />
	</div>
</div>`;
});