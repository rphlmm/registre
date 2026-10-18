/*
 * registre — scripts du thème (sans dépendance, chargé en « defer »).
 * Tout est en amélioration progressive : sans JavaScript, le site reste complet,
 * on perd seulement les figures, les filtres de la page Archives et les outils de copie.
 *
 * 1. Petites aides        5. Page Archives : filtres et années
 * 2. Raccourci clavier    6. Lettre : index des liens, copie, partage
 * 3. Badge « nouveau »    7. Lettre : citation APA et export BibTeX
 * 4. Figures générées
 */
(function () {
    'use strict';

    /* 1. Petites aides ---------------------------------------------------- */

    var doc = document;
    var FR = /^fr/i.test(doc.documentElement.lang || '');

    function $(sel, ctx) {
        return (ctx || doc).querySelector(sel);
    }

    function $$(sel, ctx) {
        return Array.prototype.slice.call((ctx || doc).querySelectorAll(sel));
    }

    var T = FR ? {
        linksCopied: 'Liens copiés',
        citeCopied: 'Citation copiée',
        urlCopied: 'Adresse copiée',
        bibtex: 'Fichier BibTeX téléchargé',
        copyFailed: 'Copie impossible',
        copyLinks: function (n) { return n > 1 ? 'Copier les ' + n + ' liens' : 'Copier le lien'; },
        topics: function (n) { return n + (n > 1 ? ' rubriques' : ' rubrique'); },
        shown: function (s, t) { return s + (s > 1 ? ' lettres affichées' : ' lettre affichée') + ' sur ' + t; },
        allYears: 'Toutes les années'
    } : {
        linksCopied: 'Links copied',
        citeCopied: 'Citation copied',
        urlCopied: 'Address copied',
        bibtex: 'BibTeX file downloaded',
        copyFailed: 'Could not copy',
        copyLinks: function (n) { return n > 1 ? 'Copy the ' + n + ' links' : 'Copy the link'; },
        topics: function (n) { return n + (n > 1 ? ' topics' : ' topic'); },
        shown: function (s, t) { return s + ' of ' + t + (t > 1 ? ' letters' : ' letter'); },
        allYears: 'All years'
    };

    var toastTimer;
    function toast(message) {
        var el = $('[data-rg-toast]');
        if (!el) {
            return;
        }
        el.textContent = message;
        el.classList.add('is-visible');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(function () {
            el.classList.remove('is-visible');
        }, 2400);
    }

    function copyText(text) {
        if (navigator.clipboard && window.isSecureContext) {
            return navigator.clipboard.writeText(text);
        }
        return new Promise(function (resolve, reject) {
            var area = doc.createElement('textarea');
            area.value = text;
            area.setAttribute('readonly', '');
            area.style.position = 'fixed';
            area.style.opacity = '0';
            doc.body.appendChild(area);
            area.select();
            var ok = false;
            try {
                ok = doc.execCommand('copy');
            } catch (e) {
                ok = false;
            }
            doc.body.removeChild(area);
            if (ok) {
                resolve();
            } else {
                reject(new Error('copy'));
            }
        });
    }

    function copyWithToast(text, message) {
        copyText(text).then(function () {
            toast(message);
        }, function () {
            toast(T.copyFailed);
        });
    }

    function normalize(str) {
        return String(str || '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .trim();
    }

    function canClipboard() {
        return !!(navigator.clipboard && window.isSecureContext) || !!doc.queryCommandSupported;
    }

    /* 2. Raccourci clavier de la recherche -------------------------------- */

    var isApple = /Mac|iPhone|iPad|iPod/i.test(navigator.platform || navigator.userAgent || '');
    if (!isApple) {
        $$('[data-rg-kbd]').forEach(function (kbd) {
            kbd.textContent = 'Ctrl K';
        });
    }

    /* 3. Badge « nouveau » : lettres publiées depuis moins de 7 jours ----- */

    var now = Date.now();
    $$('[data-rg-new]').forEach(function (badge) {
        var host = badge.closest('[data-rg-date]');
        var date = host ? host.getAttribute('data-rg-date') : '';
        var time = Date.parse(date + 'T12:00:00');
        if (!isNaN(time) && now - time < 7 * 864e5 && now - time > -864e5) {
            badge.hidden = false;
        }
    });

    /* 4. Figures générées : un rayon par minute, un cercle par rubrique --- */

    function hash(str) {
        var h = 2166136261;
        for (var i = 0; i < str.length; i++) {
            h ^= str.charCodeAt(i);
            h = Math.imul(h, 16777619);
        }
        return h >>> 0;
    }

    function random(seed) {
        var a = seed;
        return function () {
            a = (a + 0x6d2b79f5) | 0;
            var t = Math.imul(a ^ (a >>> 15), 1 | a);
            t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }

    function svgEl(name, attrs) {
        var el = doc.createElementNS('http://www.w3.org/2000/svg', name);
        Object.keys(attrs).forEach(function (key) {
            el.setAttribute(key, attrs[key]);
        });
        return el;
    }

    $$('[data-rg-fig]').forEach(function (fig) {
        var svg = $('svg', fig);
        if (!svg) {
            return;
        }
        var minutes = Math.max(1, Math.min(30, parseInt(fig.getAttribute('data-minutes'), 10) || 1));
        var tags = (fig.getAttribute('data-tags') || '').trim().split(/\s+/).filter(Boolean);
        var rings = Math.min(4, tags.length);
        var rand = random(hash(fig.getAttribute('data-seed') || 'registre'));
        var c = 100;

        for (var k = 0; k < rings; k++) {
            svg.appendChild(svgEl('circle', {cx: c, cy: c, r: 28 + k * 21, class: 'ring'}));
        }

        for (var i = 0; i < minutes; i++) {
            var angle = -Math.PI / 2 + (i * 2 * Math.PI) / minutes + (rand() - 0.5) * 0.24;
            var length = 42 + rand() * 44;
            var x = c + length * Math.cos(angle);
            var y = c + length * Math.sin(angle);
            var accent = i === 0 ? '--accent' : '';
            svg.appendChild(svgEl('line', {x1: c, y1: c, x2: x.toFixed(1), y2: y.toFixed(1), class: 'ray ray' + accent}));
            svg.appendChild(svgEl('rect', {x: (x - 3).toFixed(1), y: (y - 3).toFixed(1), width: 6, height: 6, class: 'tip tip' + accent}));
        }
        svg.appendChild(svgEl('circle', {cx: c, cy: c, r: 3, class: 'hub'}));

        var legend = $('[data-rg-fig-legend]', fig);
        if (legend) {
            legend.textContent = minutes + ' min · ' + T.topics(rings);
        }
        fig.hidden = false;
    });

    /* 5. Page Archives : regroupement par année et filtres ---------------- */

    var archive = $('[data-rg-archive]');
    if (archive) {
        var index = $('[data-rg-index]', archive);
        var rows = $$('.rg-row', index);
        var total = rows.length;
        var totalEl = $('[data-rg-total]');
        if (totalEl) {
            totalEl.textContent = '(' + total + ')';
        }

        // Regroupe les lignes par année, de la plus récente à la plus ancienne.
        var byYear = {};
        rows.forEach(function (row) {
            var year = row.getAttribute('data-rg-year') || '';
            (byYear[year] = byYear[year] || []).push(row);
        });
        var years = Object.keys(byYear).sort(function (a, b) {
            return b - a;
        });
        var groups = doc.createElement('div');
        years.forEach(function (year) {
            var group = doc.createElement('section');
            group.setAttribute('data-rg-year-group', year);
            group.setAttribute('aria-labelledby', 'annee-' + year);
            var heading = doc.createElement('h3');
            heading.className = 'rg-index__year';
            heading.id = 'annee-' + year;
            heading.textContent = year + ' ';
            var count = doc.createElement('span');
            count.textContent = '(' + byYear[year].length + ')';
            heading.appendChild(count);
            var list = doc.createElement('ol');
            list.className = 'rg-index';
            byYear[year].forEach(function (row) {
                list.appendChild(row);
            });
            group.appendChild(heading);
            group.appendChild(list);
            groups.appendChild(group);
        });
        index.replaceWith(groups);

        var fieldset = $('[data-rg-filter]', archive);
        var boxes = $$('[data-rg-filter-tag]', archive);
        var clearBtn = $('[data-rg-filter-clear]', archive);
        var noJsList = $('.rg-side__list--nojs', archive);
        var textWrap = $('[data-rg-textfilter]', archive);
        var input = $('[data-rg-q]', archive);
        var status = $('[data-rg-status]', archive);
        var empty = $('[data-rg-empty]', archive);
        var yearsBlock = $('[data-rg-years]', archive);
        var yearsList = $('[data-rg-years-list]', archive);
        var selectedYear = '';

        if (fieldset) {
            fieldset.hidden = false;
        }
        if (noJsList) {
            noJsList.hidden = true;
        }
        if (textWrap) {
            textWrap.hidden = false;
        }

        function yearButton(label, value, n) {
            var li = doc.createElement('li');
            var btn = doc.createElement('button');
            btn.type = 'button';
            btn.setAttribute('data-year', value);
            btn.setAttribute('aria-pressed', value === selectedYear ? 'true' : 'false');
            var name = doc.createElement('span');
            name.textContent = label;
            btn.appendChild(name);
            if (n !== undefined) {
                var c = doc.createElement('span');
                c.className = 'rg-side__count';
                c.textContent = n;
                btn.appendChild(c);
            }
            btn.addEventListener('click', function () {
                selectedYear = value;
                $$('button', yearsList).forEach(function (b) {
                    b.setAttribute('aria-pressed', b.getAttribute('data-year') === selectedYear ? 'true' : 'false');
                });
                apply();
            });
            li.appendChild(btn);
            yearsList.appendChild(li);
        }

        if (yearsBlock && yearsList && years.length > 1) {
            yearButton(T.allYears, '', total);
            years.forEach(function (year) {
                yearButton(year, year, byYear[year].length);
            });
            yearsBlock.hidden = false;
        }

        // Lecture des filtres dans l'adresse : ?rubrique=a,b&annee=2026&q=texte
        var params = new URLSearchParams(window.location.search);
        var fromUrl = (params.get('rubrique') || '').split(',').filter(Boolean);
        boxes.forEach(function (box) {
            box.checked = fromUrl.indexOf(box.value) > -1;
        });
        if (params.get('annee') && byYear[params.get('annee')]) {
            selectedYear = params.get('annee');
            $$('button', yearsList).forEach(function (b) {
                b.setAttribute('aria-pressed', b.getAttribute('data-year') === selectedYear ? 'true' : 'false');
            });
        }
        if (input && params.get('q')) {
            input.value = params.get('q');
        }

        function apply() {
            var tags = boxes.filter(function (b) { return b.checked; }).map(function (b) { return b.value; });
            var q = normalize(input ? input.value : '');
            var shown = 0;

            rows.forEach(function (row) {
                var rowTags = ' ' + (row.getAttribute('data-rg-tags') || '') + ' ';
                var okTags = !tags.length || tags.some(function (t) { return rowTags.indexOf(' ' + t + ' ') > -1; });
                var okYear = !selectedYear || row.getAttribute('data-rg-year') === selectedYear;
                var okText = !q || normalize(row.getAttribute('data-rg-title')).indexOf(q) > -1;
                var visible = okTags && okYear && okText;
                row.hidden = !visible;
                if (visible) {
                    shown++;
                }
            });

            $$('[data-rg-year-group]', groups).forEach(function (group) {
                group.hidden = !$('.rg-row:not([hidden])', group);
            });

            var filtered = tags.length || selectedYear || q;
            if (status) {
                status.textContent = filtered ? T.shown(shown, total) : '';
            }
            if (empty) {
                empty.hidden = shown > 0;
            }
            if (clearBtn) {
                clearBtn.hidden = !tags.length;
            }

            var next = new URLSearchParams();
            if (tags.length) {
                next.set('rubrique', tags.join(','));
            }
            if (selectedYear) {
                next.set('annee', selectedYear);
            }
            if (q) {
                next.set('q', input.value.trim());
            }
            var query = next.toString();
            window.history.replaceState(null, '', window.location.pathname + (query ? '?' + query : '') + window.location.hash);
        }

        boxes.forEach(function (box) {
            box.addEventListener('change', apply);
        });
        if (clearBtn) {
            clearBtn.addEventListener('click', function () {
                boxes.forEach(function (b) { b.checked = false; });
                apply();
                if (boxes[0]) {
                    boxes[0].focus();
                }
            });
        }
        if (input) {
            input.addEventListener('input', apply);
        }
        apply();
    }

    /* 6. Lettre : index des liens, copie, partage ------------------------- */

    var prose = $('.rg-article .rg-prose');
    var tools = $('[data-rg-tools]');

    // Ghost ajoute « ?ref=<site> » aux liens sortants : on le retire des liens copiés.
    function cleanUrl(href) {
        try {
            var u = new URL(href);
            if (u.searchParams.get('ref') === window.location.hostname) {
                u.searchParams.delete('ref');
            }
            return u.toString();
        } catch (e) {
            return href;
        }
    }

    if (prose) {
        var links = $$('.kg-bookmark-card', prose).map(function (card, i) {
            var anchor = $('.kg-bookmark-container', card);
            var titleEl = $('.kg-bookmark-title', card);
            var num = String(i + 1).padStart(2, '0');
            var host = '';
            try {
                host = new URL(anchor.href).hostname.replace(/^www\./, '');
            } catch (e) {
                host = '';
            }
            if (!card.id) {
                card.id = 'ref-' + num;
            }
            return {
                id: card.id,
                num: num,
                href: anchor ? cleanUrl(anchor.href) : '',
                title: titleEl ? titleEl.textContent.trim() : host,
                host: host
            };
        }).filter(function (l) {
            return l.href;
        });

        if (links.length) {
            var linkIndex = $('[data-rg-linkindex]');
            var linkList = $('[data-rg-linkindex-list]');
            if (linkIndex && linkList) {
                links.forEach(function (l) {
                    var li = doc.createElement('li');
                    var a = doc.createElement('a');
                    a.href = '#' + l.id;
                    a.title = l.title;
                    var n = doc.createElement('span');
                    n.className = 'rg-linkindex__num';
                    n.textContent = l.num;
                    var h = doc.createElement('span');
                    h.textContent = l.host || l.title;
                    a.appendChild(n);
                    a.appendChild(h);
                    li.appendChild(a);
                    linkList.appendChild(li);
                });
                linkIndex.hidden = false;
            }

            var copyLinks = $('[data-rg-copy-links]');
            if (copyLinks && canClipboard()) {
                var label = $('[data-rg-copy-links-label]', copyLinks);
                if (label) {
                    label.textContent = T.copyLinks(links.length);
                }
                copyLinks.hidden = false;
                copyLinks.addEventListener('click', function () {
                    var text = links.map(function (l) {
                        return '- [' + l.title.replace(/[[\]]/g, '') + '](' + l.href + ')';
                    }).join('\n');
                    copyWithToast(text, T.linksCopied);
                });
            }
        }

        if (tools) {
            tools.hidden = false;
        }
    }

    var copyUrl = $('[data-rg-copy-url]');
    if (copyUrl && canClipboard()) {
        copyUrl.hidden = false;
        copyUrl.addEventListener('click', function () {
            copyWithToast(window.location.href.split('#')[0], T.urlCopied);
        });
    }

    var shareBtn = $('[data-rg-share]');
    if (shareBtn && navigator.share) {
        shareBtn.hidden = false;
        shareBtn.addEventListener('click', function () {
            navigator.share({title: doc.title, url: window.location.href.split('#')[0]}).catch(function () {});
        });
    }

    /* 7. Lettre : citation APA et export BibTeX --------------------------- */

    var cite = $('[data-rg-cite]');

    // « Raphaël Martin » → « Martin, R. » ; « Jean-Lucien Martin » → « Martin, J.-L. »
    function apaName(full) {
        var parts = String(full || '').trim().split(/\s+/);
        if (parts.length < 2) {
            return parts[0] || '';
        }
        var last = parts.pop();
        var initials = parts.map(function (p) {
            return p.split('-').map(function (s) { return s.charAt(0).toUpperCase() + '.'; }).join('-');
        }).join(' ');
        return last + ', ' + initials;
    }

    function bibName(full) {
        var parts = String(full || '').trim().split(/\s+/);
        if (parts.length < 2) {
            return parts[0] || '';
        }
        var last = parts.pop();
        return last + ', ' + parts.join(' ');
    }

    function bibEscape(str) {
        return String(str || '').replace(/([&%$#_])/g, '\\$1').replace(/[{}]/g, '');
    }

    function asciiWord(str) {
        return normalize(str).replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(function (w) {
            return w.length > 3;
        })[0] || 'lettre';
    }

    if (cite) {
        var data = cite.dataset;
        var auto = $('[data-rg-cite-auto]', cite);
        if (auto) {
            auto.textContent = apaName(data.author);
        }

        var actions = $('[data-rg-cite-actions]', cite);
        if (actions) {
            actions.hidden = false;
        }

        var copyCite = $('[data-rg-copy-cite]', cite);
        if (copyCite) {
            copyCite.addEventListener('click', function () {
                var text = $('[data-rg-cite-text]', cite).textContent.replace(/\s+/g, ' ').trim();
                copyWithToast(text, T.citeCopied);
            });
        }

        $$('[data-rg-bibtex]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var year = (data.date || '').slice(0, 4);
                var last = normalize(String(data.author || '').trim().split(/\s+/).pop()).replace(/[^a-z0-9]/g, '') || 'auteur';
                var key = last + year + asciiWord(data.title);
                var today = new Date().toISOString().slice(0, 10);
                var bib = [
                    '@online{' + key + ',',
                    '  author       = {' + bibEscape(bibName(data.author)) + '},',
                    '  title        = {' + bibEscape(data.title) + '},',
                    '  date         = {' + data.date + '},',
                    '  organization = {' + bibEscape(data.site) + '},',
                    '  note         = {' + bibEscape((FR ? 'Lettre ' : 'Letter ') + data.week) + '},',
                    '  url          = {' + data.url + '},',
                    '  urldate      = {' + today + '},',
                    '  langid       = {' + (FR ? 'french' : 'english') + '}',
                    '}',
                    ''
                ].join('\n');
                var blob = new Blob([bib], {type: 'application/x-bibtex;charset=utf-8'});
                var link = doc.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = (data.slug || key) + '.bib';
                doc.body.appendChild(link);
                link.click();
                setTimeout(function () {
                    URL.revokeObjectURL(link.href);
                    link.remove();
                }, 0);
                toast(T.bibtex);
            });
        });
    } else if (tools) {
        $$('[data-rg-bibtex]', tools).forEach(function (btn) {
            btn.hidden = true;
        });
    }
}());
