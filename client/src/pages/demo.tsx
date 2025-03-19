import ChatBubble from '@/components/chat/ChatBubble';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';

export default function Demo() {
  return (
    <>
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
        {/* Hero section */}
        <section className="container mx-auto pt-24 pb-16 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-purple-700 to-indigo-600">
              SiteHQ Chat Widget
            </h1>
            <p className="text-xl text-gray-600 mb-10">
              Add conversational AI capabilities to your website with our easy-to-integrate widget
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link href="/widget-docs">
                <Button size="lg" className="bg-purple-700 hover:bg-purple-800">
                  Implementation Guide
                </Button>
              </Link>
              <a href="/widget-demo" target="_blank" rel="noopener noreferrer">
                <Button size="lg" variant="outline">
                  View Widget Demo
                </Button>
              </a>
            </div>
          </div>
        </section>

        {/* Features section */}
        <section className="container mx-auto py-16 px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Integration Options</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-4">Script Tag</h3>
              <p className="text-gray-600 mb-4">
                Add a single script tag to your website for the easiest integration.
              </p>
              <code className="bg-gray-100 text-purple-700 text-sm p-2 rounded block mb-4 overflow-x-auto">
                {`<script src="standalone-widget.js" data-sitehq-auto="true"></script>`}
              </code>
              <Link href="/widget-docs">
                <Button variant="link" className="text-purple-700 p-0">Learn more</Button>
              </Link>
            </div>
            
            <div className="bg-white p-8 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-4">Custom Element</h3>
              <p className="text-gray-600 mb-4">
                More control over widget placement and initialization.
              </p>
              <code className="bg-gray-100 text-purple-700 text-sm p-2 rounded block mb-4 overflow-x-auto">
                {`<sitehq-chat-widget api-key="YOUR_KEY"></sitehq-chat-widget>`}
              </code>
              <Link href="/widget-docs">
                <Button variant="link" className="text-purple-700 p-0">Learn more</Button>
              </Link>
            </div>
            
            <div className="bg-white p-8 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-4">IFrame Embed</h3>
              <p className="text-gray-600 mb-4">
                Fully isolated widget for maximum compatibility.
              </p>
              <code className="bg-gray-100 text-purple-700 text-sm p-2 rounded block mb-4 overflow-x-auto">
                {`<iframe src="/widget-embed?apiKey=YOUR_KEY"></iframe>`}
              </code>
              <Link href="/widget-docs">
                <Button variant="link" className="text-purple-700 p-0">Learn more</Button>
              </Link>
            </div>
          </div>
        </section>
      </div>

      {/* Demo chat bubble */}
      <div className="fixed bottom-5 right-5 z-50">
        <ChatBubble
          apiKey="demo-key"
          agentId="demo-agent"
          title="SiteHQ Assistant"
          theme={{
            primary: '#5c078c', /* SiteHQ Purple */
            background: '#ffffff', /* White container */
            text: '#333333' /* Dark text */
          }}
        />
      </div>
    </>
  );
}