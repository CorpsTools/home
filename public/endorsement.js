window.addEventListener('load', async () => {
	const CORPS_TOOLS_URL = `${location.protocol}//${location.hostname === 'localhost' ? location.host : 'corps.tools'}`;
	const endorsementScriptElem = document.querySelector('[data-corpstools-endorsement]');
	const parsedPosition = endorsementScriptElem.dataset.position.split('-');

	const posPadding = '1rem';

	document.head.innerHTML += `
<style>
	.csg-endorsement {
		position: fixed;
		width: 246px;
		height: 60px;
		cursor: pointer;
		${parsedPosition[0]}: ${posPadding};
		${parsedPosition[1]}: ${posPadding};
		transition: all 50ms ease;
	}

	.csg-endorsement:hover {
		${parsedPosition[0]}: calc(${posPadding} + 0.5rem);
	}

	.csg-endorsement .b-ge {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		border-radius: 8px;
		background: #fefefe;
		box-shadow:  10px 10px 30px #5f5f5f,
			 -10px -10px 30px #ffffff;
		opacity: 0.9;
	}

	.csg-endorsement .f-ge {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		padding: 8px;
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.csg-endorsement img {
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
	
	const imageURL = `${CORPS_TOOLS_URL}/corps_tools_logo_text.png`;
	
	const endorsementElem = document.createElement('div');
	document.body.appendChild(endorsementElem);
	await fetch(imageURL);
	endorsementElem.outerHTML = `<div class="csg-endorsement" onclick="window.open('https://corps.tools')">
	<div class="b-ge"></div>
	<div class="f-ge">
		<img src="${CORPS_TOOLS_URL}/corps_tools_logo_text.png" />
	</div>
</div>`;
});