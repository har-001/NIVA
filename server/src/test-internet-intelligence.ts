// ============================================
// NIVA — Phase 11 Internet Intelligence Test Suite
// ============================================

import { internetService } from './modules/internet/internet.service';
import { nivaAgent } from './modules/ai/agent';

async function runInternetIntelligenceTests() {
  console.log('🧪 Starting NIVA Internet Intelligence Test Suite...\n');

  // --- TEST 1: Live Web Search ---
  console.log('--- TEST 1: Live Web Search (Multi-Engine) ---');
  const searchRes = await internetService.search('Quantum Computing', 3);
  console.log(`Query: "${searchRes.query}" | Total Results: ${searchRes.totalResults}`);
  if (searchRes.instantAnswer) {
    console.log(`Instant Answer [${searchRes.instantAnswer.source}]: ${searchRes.instantAnswer.heading}`);
  }
  searchRes.results.forEach((r, idx) => {
    console.log(` [${idx + 1}] ${r.title} (${r.source}) -> ${r.url}`);
  });
  if (searchRes.results.length === 0 && !searchRes.instantAnswer) {
    throw new Error('FAILED: Search returned 0 results and no instant answer!');
  }
  console.log('✅ PASSED: Live Web Search returned valid sources!\n');

  // --- TEST 2: Live Webpage Article Reader ---
  console.log('--- TEST 2: Live Webpage Article Reader ---');
  const testUrl = 'https://en.wikipedia.org/wiki/Artificial_intelligence';
  const pageContent = await internetService.readWebpage(testUrl);
  console.log(`Title: ${pageContent.title}`);
  console.log(`Domain: ${pageContent.domain} | Word Count: ${pageContent.wordCount} words | Reading Time: ~${pageContent.readingTimeMin} min`);
  console.log(`Snippet: ${pageContent.textSnippet.slice(0, 160)}...`);
  if (!pageContent.title || pageContent.wordCount < 50 || !pageContent.contentMarkdown) {
    throw new Error('FAILED: Web reader failed to extract article body or title!');
  }
  console.log('✅ PASSED: Webpage article successfully extracted into Markdown!\n');

  // --- TEST 3: Real-Time News Feeds ---
  console.log('--- TEST 3: Real-Time News Feed ---');
  const newsRes = await internetService.getNews('Technology', 3);
  console.log(`Topic: "${newsRes.topic}" | Articles Found: ${newsRes.items.length}`);
  newsRes.items.forEach((item, idx) => {
    console.log(` [${idx + 1}] ${item.title} (${item.source}) [${item.timeAgo}]`);
  });
  if (newsRes.items.length === 0) {
    throw new Error('FAILED: News feed returned 0 articles!');
  }
  console.log('✅ PASSED: Live News Feed returned breaking headlines!\n');

  // --- TEST 4: Agent Invocation of `web_search` Tool ---
  console.log('--- TEST 4: AI Agent `web_search` Tool Execution ---');
  let agentReply = '';
  for await (const event of nivaAgent.chatStream([], 'web search latest mars rover mission')) {
    if (event.type === 'chunk' && event.content) {
      agentReply += event.content;
    }
  }
  console.log('Agent Response Snippet:\n', agentReply.slice(0, 300) + '...\n');
  if (!agentReply.includes('web_search') && !agentReply.includes('Web Search Results') && !agentReply.includes('Source')) {
    throw new Error('FAILED: Agent response does not contain web search sources or results!');
  }
  console.log('✅ PASSED: Agent successfully executed web_search with source citations!\n');

  // --- TEST 5: Agent Invocation of `fetch_news` Tool ---
  console.log('--- TEST 5: AI Agent `fetch_news` Tool Execution ---');
  let newsReply = '';
  for await (const event of nivaAgent.chatStream([], 'latest news on artificial intelligence')) {
    if (event.type === 'chunk' && event.content) {
      newsReply += event.content;
    }
  }
  console.log('Agent News Response Snippet:\n', newsReply.slice(0, 300) + '...\n');
  if (!newsReply.includes('News Feed') && !newsReply.includes('fetch_news') && !newsReply.includes('Source')) {
    throw new Error('FAILED: Agent response does not contain live news headlines!');
  }
  console.log('✅ PASSED: Agent successfully executed fetch_news with live headline cards!\n');

  console.log('🎉 ALL PHASE 11 INTERNET INTELLIGENCE TESTS PASSED SUCCESSFULLY! 🎉');
}

runInternetIntelligenceTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
