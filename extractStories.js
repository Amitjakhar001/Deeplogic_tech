const https = require('https');
const http = require('http');

function getHTMLData(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let htmlData = '';

            res.on('data', (chunk) => {
                htmlData += chunk;
            });

            res.on('end', () => {
                resolve(htmlData);
            });
        }).on('error', (error) => {
            reject(new Error(`HTTPS request failed: ${error.message}`));
        });
    });
}

function extractLatestStories(html) {
    const stories = [];
    const regex = /<li class="latest-stories__item">([\s\S]*?)<\/li>/g;
    let match;

    while ((match = regex.exec(html)) !== null) {
        const storyHtml = match[1];
        const titleMatch = /<h3 class="latest-stories__item-headline">([\s\S]*?)<\/h3>/g.exec(storyHtml);
        const linkMatch = /<a href="([^"]*)">/g.exec(storyHtml);

        if (titleMatch && linkMatch) {
            const title = titleMatch[1].trim();
            const link = 'https://time.com' + linkMatch[1];

            stories.push({ title, link });
        }
    }

    return stories.slice(0, 6);
}

const server = http.createServer((req, res) => {
    if (req.url === '/getTimeStories' && req.method === 'GET') {
        const url = 'https://time.com/'; 

        getHTMLData(url)
            .then((htmlData) => {
                const latestStories = extractLatestStories(htmlData);
                const jsonResponse = JSON.stringify(latestStories, null, 2);

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(jsonResponse);
            })
            .catch((error) => {
                console.error('Error:', error.message);
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Internal Server Error');
            });
    } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('latest stories at http://localhost:3000/getTimeStories');
    }
});

const PORT = 3000; 
server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
