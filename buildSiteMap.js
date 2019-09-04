const cheerio = require('cheerio');
const fetch = require('node-fetch');
const fs = require('fs');

function getDomain(url){
    if(url.startsWith('https://')){
        url = url.substr(8, url.length-1);
    }
    else if(url.startsWith('http://')){
        url = url.substr(7, url.length-1);
    }
    url = url.split('/');

    return 'https://' + url[0];
}

function jointURL(domain, url){
    let finalURL = '';
    finalURL = domain + (url[0]==='/' ? url : '/'+url);
    return finalURL;
}

function returnLinksAndImage(siteMap, domain, url, callback){
    let urlWithSameDomain = [];
    let page_url = '';
    fetch(url)
        .then(res => {page_url = res.url; return res.text();})
        .then(res => {
            if(isFetched(page_url, siteMap)){
                callback([], siteMap);
                return;
            }

            console.log('Fetching: '+ url );
            let log = 'Fetching: '+ url + '\n';
            fs.appendFile('./fetchlog.txt', log, (err)=>{
                if(err) throw err;
            });

            urlWithSameDomain.push(page_url);
            let $ = cheerio.load(res);
            let links = [];
            $('a').each((i,el)=>{
                let href = $(el).attr('href');
                if(href == undefined)
                    return;

                if(href.startsWith('#'))
                    return;

                if(href.startsWith('mailto:'))
                    return;

                if(!href.startsWith('http'))
                    href = jointURL(domain, href);

                // check for duplicate link
                if(!links.includes(href) && page_url !== href){
                    links.push(href);
                    if(!urlWithSameDomain.includes(href) && href.startsWith(domain))
                        urlWithSameDomain.push(href);
                }
            });

            let imgLinks = [];
            $('img').each((i,el)=>{
                let src = $(el).attr('src');
                if(src==undefined)  
                    return;

                if(!src.startsWith('http'))
                    src = jointURL(domain, src);

                // check for duplicate link
                if(!imgLinks.includes(src) && page_url !== src)
                    imgLinks.push(src);

            });
            
            let info = {
                page_url,
                links,
                images: imgLinks
            };
            siteMap.push(info);
            callback(urlWithSameDomain, siteMap);
        })
        .catch(error=>{
            console.log(error.message);
            fs.appendFile('./errers.txt', error.message+"\n", (err)=>{
                if(err) throw err;
            });
            callback([], siteMap);
        });
}

function isFetched(url, siteMap){
    let fetched = false;
    for(let i = 0; i < siteMap.length; i++){
        if(siteMap[i].page_url === url){
            fetched = true;
            break;
        }
    }

    return fetched;
}

function build_this_level(siteMap, domain, depth, urls, urlsNextLevel, callback){
    if(depth > 0){
        if(urls.length !== 0){
            // same level fetching/crawling
            if(!isFetched(urls[urls.length-1], siteMap)){
                // console.log('Depth: '+depth+'. Fetching: '+ urls[urls.length-1]);
                // let log = 'Depth: '+depth+'. Fetching: '+ urls[urls.length-1] + '\n';
                // fs.appendFile('./fetchlog.txt', log, (err)=>{
                //     if(err) throw err;
                // });
                returnLinksAndImage(siteMap, domain, urls[urls.length - 1], (urlWithSameDomain, sm)=>{
                    urlsNextLevel = [...urlsNextLevel, ...urlWithSameDomain];
                    urls.pop();
                    build_this_level(sm, domain, depth, urls, urlsNextLevel, callback);
                });
            }
            else{
                urls.pop();
                build_this_level(siteMap, domain, depth, urls, urlsNextLevel, callback);
            }
        }
        else{
            // next level fetching/crawling
            build_this_level(siteMap, domain, depth-1, urlsNextLevel, [], callback);
        }
    }
    else {
        callback(siteMap);
    }
}

function build_site_map(url, max_depth){
    if (!url || ! max_depth){
        console.log('You have to enter a domain and max depth to start.');
        console.log('Command: node buildSiteMap <domain> <max_depth>');
        return;
    }

    max_depth = parseInt(max_depth);

    let domain = '';
    if(!url.startsWith('http'))
        url = 'https://'+url;

    if(max_depth > 0){
        fetch(url)
            // get fetched url address -- some site will redirect entered url to other address
            .then(response=>response.url) 
            .then(res_url=>{
                domain = getDomain(res_url);
                console.log('Domain: '+domain);

                build_this_level([], domain, max_depth, [url], [], (siteMap)=>{
                    fs.writeFile('./sitemap.json', JSON.stringify(siteMap), (err)=>{
                        if(err) throw err;

                        console.log('Site map is built. Json file locates at ./sitemap.json');
                    });
                })
            })
            .catch(err=>{
                fs.appendFile('./errers.txt', err.message+'\n', (error)=>{
                    if(error) throw error;
                });
                console.log('Fetch error with domain. Please check your spelling.');
            });
    }
        

    else{
        console.log('Max depth is 0 or less. No action.');
    }
}

let inputs = process.argv;
build_site_map(inputs[2], inputs[3]);
