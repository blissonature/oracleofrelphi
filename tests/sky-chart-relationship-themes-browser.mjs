import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const base='http://127.0.0.1:4173/sky-chart.html';
const browser=await chromium.launch({headless:true});
try{
  const page=await browser.newPage({viewport:{width:1200,height:900}});
  await page.goto(base,{waitUntil:'domcontentloaded',timeout:30000});
  await page.waitForFunction(()=>!!window.RelphiSemanticSearch&&!!window.RelphiRelationshipThemes,{timeout:30000});
  await page.waitForSelector('#skyFoundationFocus .sky-chart-filter-bar [data-theme-search="true"]',{timeout:30000});

  const ui=await page.locator('[data-theme-filter="true"]').evaluate(node=>({
    label:node.querySelector('span')?.textContent?.trim()||'',
    placeholder:node.querySelector('input')?.getAttribute('placeholder')||''
  }));
  assert.equal(ui.label,'Themes');
  assert.match(ui.placeholder,/care/i);

  const result=await page.evaluate(async()=>{
    window.RELPHI_TAROT_CARDS=[
      ...(Array.isArray(window.RELPHI_TAROT_CARDS)?window.RELPHI_TAROT_CARDS:[]),
      {
        card_id:'theme_test_moon',
        name:'Theme Test Moon',
        card_type:'Major',
        tags:['dreaming','night memory'],
        astrology:{planet:'Moon',sign:'Cancer'},
        systems:{golden_dawn_rws:{title:'Test lunar title'},thoth:{title:'Test lunar title'}}
      }
    ];

    const list=document.getElementById('skyFoundationRelationshipList');
    const make=(id,left,leftSign,leftHouse,right,rightSign,rightHouse,aspect)=>{
      const row=document.createElement('button');
      row.type='button';
      row.className='sky-foundation-relationship-row';
      row.dataset.relationIndex=id;
      row.dataset.relationshipMode='A-A';
      row.dataset.leftSky='A';row.dataset.rightSky='A';
      row.dataset.leftPlacement=left;row.dataset.rightPlacement=right;
      row.dataset.leftSign=String(leftSign);row.dataset.rightSign=String(rightSign);
      row.dataset.leftHouse=String(leftHouse);row.dataset.rightHouse=String(rightHouse);
      row.dataset.aspect=aspect;row.dataset.phaseError='0';row.dataset.sourceOrb='0';
      row.textContent=left+' '+aspect+' '+right;
      list.appendChild(row);return row;
    };
    const care=make('theme-test-care','moon',3,5,'venus',6,7,'trine');
    const authority=make('theme-test-authority','saturn',9,10,'mars',0,1,'square');

    const api=window.RelphiRelationshipThemes;
    const careCorpus=api.corpusFor(care);
    const authorityCorpus=api.corpusFor(authority);
    const tick=()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));

    api.set('care children');
    await tick();
    const careAndChildren={care:!care.classList.contains('sky-chart-theme-filter-hidden'),authority:!authority.classList.contains('sky-chart-theme-filter-hidden')};

    api.set('dreaming');
    await tick();
    const tarotTag={care:!care.classList.contains('sky-chart-theme-filter-hidden'),authority:!authority.classList.contains('sky-chart-theme-filter-hidden')};

    api.clear();
    await tick();
    const cleared={care:!care.classList.contains('sky-chart-theme-filter-hidden'),authority:!authority.classList.contains('sky-chart-theme-filter-hidden')};

    care.remove();authority.remove();
    return{careCorpus,authorityCorpus,careAndChildren,tarotTag,cleared};
  });

  assert.match(result.careCorpus,/care/,'Cancer/Moon semantic corpus should expose care.');
  assert.match(result.careCorpus,/children/,'House 5 semantic corpus should expose children.');
  assert.match(result.careCorpus,/dreaming/,'Tarot tags tied to endpoint correspondences should enter the relationship corpus.');
  assert.match(result.authorityCorpus,/authority/,'House 10 semantic corpus should expose authority.');
  assert.deepEqual(result.careAndChildren,{care:true,authority:false},'Multiple theme terms must AND together.');
  assert.deepEqual(result.tarotTag,{care:true,authority:false},'Tarot Ledger tags should filter Relationships.');
  assert.deepEqual(result.cleared,{care:true,authority:true},'Clearing Themes must restore rows.');

  console.log('Relationship Themes semantic filter passed.');
}finally{
  await browser.close();
}
