import axios from "axios";
import { load } from "cheerio";
import { CovidNumbers } from "../types/covid";
import { SourceExtractor } from "../types/sources";
import { neutralizeNumber, sanitizeNumber } from "../utils/number";

/**
 * Extracts case, death and recovery numbers by using cheerio to parse the given HTML.
 */
export default class WorldometerNumberExtractor extends SourceExtractor<CovidNumbers> {
    public url: string;

    /**
     * Builds a new Worldometers.com extractor.
     * @param url The URL that should be scraped.
     */
    constructor(url: string) {
        super();
        this.url = url.replace(/^(https?:)?\/\//, "https://");
    }

    /**
     * Runs numbers and returns a data object.
     */
    public async execute(): Promise<CovidNumbers> {
        const html = await this.fetchHtml(this.url);
        const $ = load(html);

        const cases = sanitizeNumber($(".maincounter-number").eq(0).text());
        const deaths = sanitizeNumber($(".maincounter-number").eq(1).text());
        const hospitalized = 0;
        const recoveries = sanitizeNumber($(".maincounter-number").eq(2).text());
        const active = cases - deaths - recoveries;

        return {
            cases: neutralizeNumber(cases),
            deaths: neutralizeNumber(deaths),
            hospitalized: neutralizeNumber(hospitalized),
            recoveries: neutralizeNumber(recoveries),
            active: neutralizeNumber(active)
        };
    }

    /**
     * Attempts to fetch HTML from the given URL.
     * @param url URL to fetch.
     */
    private async fetchHtml(url: string): Promise<string> {
        return await axios
            .get(url)
            .then(response => response.data)
            .catch(error => {
                error.status = (error.response && error.response.status) || 500;
                throw error;
            });
    }
}
